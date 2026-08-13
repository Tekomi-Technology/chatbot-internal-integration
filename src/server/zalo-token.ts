import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { exchangeRefreshToken, ZaloError } from "@/lib/zalo";

/** Refresh sớm hơn hạn thật ngần này để không gửi tin bằng token sắp chết. */
const EXPIRY_MARGIN_MS = 5 * 60_000;

/**
 * Ngân sách thời gian cho cả transaction.
 *
 * QUY TẮC: đồng hồ này bắt đầu chạy từ lúc transaction MỞ, nên ngân sách phải
 * phủ ĐỦ BA VẾ — thời gian chờ advisory lock + 10s timeout của lời gọi mạng +
 * lệnh ghi token mới. Chỉ so với riêng 10s timeout mạng là tính thiếu.
 *
 * Vì sao tính thiếu thì nguy hiểm: caller A giữ lock rồi refresh timeout ở
 * t≈10s; caller B mở transaction từ t≈0, chờ lock hết 10s đó, refresh của B
 * THÀNH CÔNG ở t≈19.9s, rồi lệnh `update` rơi vào transaction đã hết hạn →
 * P2028 → rollback → refresh token Zalo vừa cấp biến mất, kênh chết vĩnh viễn.
 * Đúng thảm hoạ mà cả hàm này sinh ra để chặn.
 *
 * 40s = 4× timeout mạng: đủ chỗ cho một lượt chờ lock đầy + một lượt mạng đầy
 * + lệnh ghi, vẫn còn biên.
 */
const TRANSACTION_TIMEOUT_MS = 40_000;

/** Tuỳ chọn chung của hai hàm lấy token. */
export type AccessTokenOptions = {
  /**
   * Coi là hết hạn khi còn dưới ngần này. Mặc định `EXPIRY_MARGIN_MS` (5 phút).
   * Cron truyền biên rộng hơn để chủ động xoay token trước hạn.
   */
  marginMs?: number;
};

export type AccessTokenResult = {
  accessToken: string;
  /** `true` chỉ khi lượt gọi này thực sự đổi refresh token với Zalo. */
  refreshed: boolean;
};

/** Token còn dùng được quá biên `marginMs` hay chưa. */
function isStillValid(
  channel: { accessTokenEncrypted: string | null; accessTokenExpiresAt: Date | null },
  marginMs: number,
): channel is { accessTokenEncrypted: string; accessTokenExpiresAt: Date } {
  // Hai phép so sánh `!== null` và `!== ""` cộng lại tương đương đúng phép kiểm
  // truthy của chuỗi; viết tách ra để type predicate bên trên thu hẹp được kiểu.
  return (
    channel.accessTokenEncrypted !== null &&
    channel.accessTokenEncrypted !== "" &&
    channel.accessTokenExpiresAt !== null &&
    channel.accessTokenExpiresAt.getTime() - marginMs > Date.now()
  );
}

/**
 * Đường nhanh: đọc token NGOÀI transaction, không lấy advisory lock.
 *
 * Vì sao an toàn dù không có lock: hàm này chỉ có thể trả về một token CÒN HẠN
 * quá biên `marginMs`. Nó không bao giờ tự quyết định refresh, không ghi gì vào
 * DB, và không đụng tới refresh token. Mọi quyết định refresh vẫn nằm trọn
 * trong lock ở `refreshUnderLock`, nơi channel được ĐỌC LẠI nên bất biến (b)
 * còn nguyên. Trường hợp xấu nhất của đua ở đây là đọc phải bản ghi hơi cũ:
 * token cũ vẫn còn hạn nên vẫn gửi tin được, và lượt sau sẽ thấy bản mới.
 *
 * Trả `null` nghĩa là "không kết luận được" — nơi gọi phải xuống đường chậm.
 */
async function readFastPath(
  channelId: string,
  marginMs: number,
): Promise<string | null> {
  const channel = await prisma.zaloChannel.findUnique({
    where: { id: channelId },
    select: { accessTokenEncrypted: true, accessTokenExpiresAt: true },
  });

  // Không tìm thấy kênh: KHÔNG ném ở đây mà để đường chậm ném ZaloError 404,
  // giữ đúng một chỗ sinh lỗi duy nhất.
  if (!channel || !isStillValid(channel, marginMs)) return null;

  try {
    return decryptSecret(channel.accessTokenEncrypted);
  } catch (error) {
    // CỐ TÌNH không ném ra ngoài: giải mã hỏng thì rơi xuống đường chậm, nơi
    // đã có sẵn lưới đỡ tự hồi phục bằng một lượt refresh.
    console.error(
      `zalo-token -> đường nhanh giải mã access token của kênh ${channelId} thất bại, chuyển sang đường chậm`,
      error,
    );
    return null;
  }
}

/**
 * Trả về access token dùng được cho một kênh Zalo, tự refresh khi cần.
 *
 * ĐÂY LÀ ĐƯỜNG DUY NHẤT ĐƯỢC PHÉP ĐỌC access token. Không nơi nào khác được đọc
 * thẳng `accessTokenEncrypted` từ DB.
 *
 * Vì sao phải phức tạp thế này: refresh token của Zalo CHỈ DÙNG ĐƯỢC MỘT LẦN.
 * Hai request song song cùng thấy token hết hạn sẽ cùng gọi refresh với cùng một
 * refresh token — một cái thắng, cái kia nhận token đã chết, và nếu cái thua ghi
 * DB sau thì nó ghi đè token tốt bằng rác. Advisory lock giữ XUYÊN SUỐT lời gọi
 * HTTP là thứ chặn kịch bản đó.
 *
 * Ba điều KHÔNG được đổi khi sửa hàm này:
 *   1. Không nhả lock trước khi gọi mạng.
 *   2. Phải đọc lại channel BÊN TRONG lock (request thua phải thấy token mới).
 *   3. Phải ghi token mới vào DB TRƯỚC khi trả về, trong cùng transaction.
 *
 * Đường nhanh ở đầu hàm bỏ qua ~99% transaction (token thường còn hạn tới 55
 * phút) mà không đụng vào ba bất biến trên — xem `readFastPath`.
 */
export async function resolveAccessToken(
  channelId: string,
  options?: AccessTokenOptions,
): Promise<AccessTokenResult> {
  const marginMs = options?.marginMs ?? EXPIRY_MARGIN_MS;

  const fastToken = await readFastPath(channelId, marginMs);
  if (fastToken !== null) {
    return { accessToken: fastToken, refreshed: false };
  }

  return refreshUnderLock(channelId, marginMs);
}

/**
 * Bản trả về chuỗi, cho những nơi chỉ cần token và không quan tâm có refresh
 * hay không (`zalo-handler.ts`). Giữ nguyên chữ ký cũ.
 */
export async function getValidAccessToken(
  channelId: string,
  options?: AccessTokenOptions,
): Promise<string> {
  const { accessToken } = await resolveAccessToken(channelId, options);
  return accessToken;
}

/** Đường chậm: transaction + advisory lock bao trọn lời gọi HTTP. */
async function refreshUnderLock(
  channelId: string,
  marginMs: number,
): Promise<AccessTokenResult> {
  return prisma.$transaction(
    async (tx) => {
      // Lock theo từng kênh nên các tenant hầu như không chặn nhau. `hashtext()`
      // trả int32 nên hai channelId khác nhau VẪN CÓ THỂ đụng độ và xếp hàng
      // sau nhau — đụng độ chỉ gây chậm, không gây sai. `xact` tự nhả khi
      // transaction kết thúc, kể cả khi throw — không cần unlock thủ công.
      //
      // Dùng `$executeRaw` chứ KHÔNG phải `$queryRaw`: `pg_advisory_xact_lock`
      // trả kiểu `void`, mà driver adapter pg của Prisma 7 không giải mã được
      // kiểu này ("Failed to deserialize column of type 'void'").
      // `$executeRaw` chỉ đếm số dòng nên không đụng vào giá trị trả về.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${channelId}))`;

      const channel = await tx.zaloChannel.findUnique({
        where: { id: channelId },
        select: {
          accessTokenEncrypted: true,
          accessTokenExpiresAt: true,
          refreshTokenEncrypted: true,
        },
      });

      if (!channel) {
        throw new ZaloError(`Không tìm thấy kênh Zalo ${channelId}.`, 404);
      }

      // Tách ra biến const để TypeScript thu hẹp được kiểu ở nhánh `stillValid`
      // bên dưới — không cần non-null assertion. Hai phép so sánh `!== null` và
      // `!== ""` cộng lại tương đương đúng phép kiểm truthy của chuỗi.
      const { accessTokenEncrypted, accessTokenExpiresAt } = channel;

      const stillValid =
        accessTokenEncrypted !== null &&
        accessTokenEncrypted !== "" &&
        accessTokenExpiresAt !== null &&
        accessTokenExpiresAt.getTime() - EXPIRY_MARGIN_MS > Date.now();

      // Request thua cuộc rơi vào nhánh này: token đã được request thắng làm mới.
      if (stillValid) {
        try {
          return decryptSecret(accessTokenEncrypted);
        } catch (error) {
          // CỐ TÌNH không ném ra ngoài mà rơi xuống nhánh refresh bên dưới.
          //
          // Access token giải mã hỏng (đổi ENCRYPTION_KEY, ciphertext lỗi) mà
          // ném lỗi ở đây thì kênh chết cứng và IM LẶNG: `stillValid` vẫn true
          // cho tới khi hết hạn thật nên không bao giờ tới được nhánh refresh,
          // còn `lastRefreshError` vẫn null nên dashboard tưởng kênh khoẻ.
          // Trong khi refresh token còn nguyên — kênh hoàn toàn tự hồi phục
          // được bằng một lượt refresh. Log lại để không mất dấu vết.
          console.error(
            `zalo-token -> giải mã access token của kênh ${channelId} thất bại, chuyển sang refresh`,
            error,
          );
        }
      }

      let fresh;
      try {
        fresh = await exchangeRefreshToken(
          decryptSecret(channel.refreshTokenEncrypted),
        );
      } catch (error) {
        // Ghi lỗi ở transaction RIÊNG: transaction hiện tại sắp bị huỷ vì throw.
        //
        // Lời gọi này mượn thêm một connection trong khi transaction ngoài vẫn
        // đang giữ một cái. An toàn ở đây vì nhánh này chưa hề UPDATE dòng đó
        // nên không có row lock để tự chặn mình. Nếu sau này pool bị bóp rất
        // nhỏ và có nhiều kênh refresh cùng lúc, đây là chỗ đầu tiên phải xem.
        const reason =
          error instanceof ZaloError
            ? `${error.code}: ${error.message}`
            : String(error);

        // Timeout (504) và đứt kết nối (502) là hai trường hợp KHÔNG biết được
        // Zalo đã tiêu thụ refresh token hay chưa: yêu cầu có thể đã tới nơi và
        // token cũ đã bị đốt, chỉ có phản hồi là không về kịp. Nhưng cũng có
        // thể Zalo chưa hề nhận được yêu cầu và token cũ vẫn dùng tốt ở lần
        // thử kế tiếp — đây chỉ là nghi vấn, không phải chắc chắn. Transaction
        // rollback nên DB vẫn giữ token cũ. Không sửa được bên trong bất biến
        // (c), nhưng thông điệp cần đánh dấu rõ lớp lỗi này khác lỗi nghiệp vụ
        // thường (để người vận hành để ý), mà không được khẳng định như thể
        // đã chắc chắn token đã chết.
        const mayHaveBeenConsumed =
          error instanceof ZaloError && (error.code === 504 || error.code === 502);
        const marked = mayHaveBeenConsumed
          ? `CÓ THỂ ĐÃ MẤT REFRESH TOKEN — ${reason}`
          : reason;

        await prisma.zaloChannel
          .update({
            where: { id: channelId },
            data: { lastRefreshError: marked.slice(0, 500) },
          })
          .catch((writeError) =>
            console.error("zalo-token -> ghi lastRefreshError", writeError),
          );
        throw error;
      }

      await tx.zaloChannel.update({
        where: { id: channelId },
        data: {
          accessTokenEncrypted: encryptSecret(fresh.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + fresh.expiresInSeconds * 1000),
          refreshTokenEncrypted: encryptSecret(fresh.refreshToken),
          refreshTokenUpdatedAt: new Date(),
          lastRefreshError: null,
        },
      });

      return fresh.accessToken;
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );
}
