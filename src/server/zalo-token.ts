import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { exchangeRefreshToken, ZaloError } from "@/lib/zalo";

const EXPIRY_MARGIN_MS = 5 * 60_000;

const TRANSACTION_TIMEOUT_MS = 40_000;

export type AccessTokenOptions = {
  marginMs?: number;
};

export type AccessTokenResult = {
  accessToken: string;
  refreshed: boolean;
};

function isStillValid(
  channel: { accessTokenEncrypted: string | null; accessTokenExpiresAt: Date | null },
  marginMs: number,
): channel is { accessTokenEncrypted: string; accessTokenExpiresAt: Date } {
  return (
    channel.accessTokenEncrypted !== null &&
    channel.accessTokenEncrypted !== "" &&
    channel.accessTokenExpiresAt !== null &&
    channel.accessTokenExpiresAt.getTime() - marginMs > Date.now()
  );
}

async function readFastPath(
  channelId: string,
  marginMs: number,
): Promise<string | null> {
  const channel = await prisma.zaloChannel.findUnique({
    where: { id: channelId },
    select: { accessTokenEncrypted: true, accessTokenExpiresAt: true },
  });

  if (!channel || !isStillValid(channel, marginMs)) return null;

  try {
    return decryptSecret(channel.accessTokenEncrypted);
  } catch (error) {
    console.error(
      `zalo-token -> đường nhanh giải mã access token của kênh ${channelId} thất bại, chuyển sang đường chậm`,
      error,
    );
    return null;
  }
}

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

export async function getValidAccessToken(
  channelId: string,
  options?: AccessTokenOptions,
): Promise<string> {
  const { accessToken } = await resolveAccessToken(channelId, options);
  return accessToken;
}

async function refreshUnderLock(
  channelId: string,
  marginMs: number,
): Promise<AccessTokenResult> {
  return prisma.$transaction(
    async (tx) => {
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

      const { accessTokenEncrypted, accessTokenExpiresAt } = channel;

      const stillValid =
        accessTokenEncrypted !== null &&
        accessTokenEncrypted !== "" &&
        accessTokenExpiresAt !== null &&
        accessTokenExpiresAt.getTime() - marginMs > Date.now();

      if (stillValid) {
        try {
          return { accessToken: decryptSecret(accessTokenEncrypted), refreshed: false };
        } catch (error) {
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
        const reason =
          error instanceof ZaloError
            ? `${error.code}: ${error.message}`
            : String(error);
        const mayHaveBeenConsumed =
          error instanceof ZaloError && error.code === 504;
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

      return { accessToken: fresh.accessToken, refreshed: true };
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );
}
