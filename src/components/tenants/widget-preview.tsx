"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

import type { WidgetConfigValues } from "@/components/tenants/widget-config-tab";

/**
 * Bản mô phỏng giao diện widget để admin xem trước khi lưu.
 *
 * Đây là bản dựng lại bằng Tailwind, KHÔNG phải widget thật — widget thật là
 * vanilla JS trong public/widget.js. Khi sửa CSS ở đó, sửa cả file này cho khớp:
 * header nền màu chủ đạo chữ trắng, vùng tin nhắn nền #f8fafc, bubble bot trắng
 * viền #e2e8f0, bubble user nền màu chủ đạo chữ trắng.
 */
export function WidgetPreview({ config }: { config: WidgetConfigValues }) {
  const isInline = config.mode === "INLINE";
  const isLeft = config.position === "BOTTOM_LEFT";

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-border bg-secondary p-4">
        {/* Khung giả lập website của tenant. */}
        <div
          aria-hidden
          className="relative mx-auto h-[520px] w-full max-w-[360px] select-none overflow-hidden rounded-lg border border-border bg-white"
        >
          {isInline ? (
            <div className="absolute inset-3">
              <ChatPanel config={config} showClose={false} />
            </div>
          ) : (
            <>
              <div className="absolute inset-x-3 bottom-[74px] top-3">
                <ChatPanel config={config} showClose />
              </div>
              <div
                className={`absolute bottom-3 flex size-12 items-center justify-center rounded-full text-white shadow-lg ${
                  isLeft ? "left-3" : "right-3"
                }`}
                style={{ backgroundColor: config.primaryColor }}
              >
                <MessageCircle className="size-6" />
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {isInline
          ? "Chế độ inline: khung chat lấp đầy div mà tenant chỉ định, không có bong bóng."
          : `Chế độ bubble: bong bóng nổi ở góc dưới bên ${isLeft ? "trái" : "phải"}, khung chat mở ra phía trên.`}
      </p>
    </div>
  );
}

function ChatPanel({
  config,
  showClose,
}: {
  config: WidgetConfigValues;
  showClose: boolean;
}) {
  const botName = config.botName.trim() || "Trợ lý AI";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xl">
      <div
        className="flex shrink-0 items-center gap-2.5 px-3.5 py-3 text-white"
        style={{ backgroundColor: config.primaryColor }}
      >
        <Avatar
          key={config.logoUrl ?? ""}
          logoUrl={config.logoUrl}
          botName={botName}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {botName}
        </span>
        {showClose ? <X className="size-4 shrink-0 opacity-85" /> : null}
      </div>

      <div className="flex min-h-14 flex-1 flex-col gap-2.5 overflow-hidden bg-slate-50 p-4">
        {config.welcomeMessage.trim() ? (
          <p className="max-w-[82%] self-start whitespace-pre-wrap rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-[13px] leading-snug text-slate-900">
            {config.welcomeMessage}
          </p>
        ) : null}

        {/* Form bật thì khách chưa chat được gì, nên không mô phỏng hội thoại. */}
        {config.leadFormEnabled ? null : (
          <>
            <p
              className="max-w-[82%] self-end rounded-xl rounded-br-sm px-3 py-2 text-[13px] leading-snug text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              Cho tôi xem bảng giá với.
            </p>

            <div className="flex items-center gap-1 self-start rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3 py-3">
              <span className="size-1.5 rounded-full bg-slate-400" />
              <span className="size-1.5 rounded-full bg-slate-300" />
              <span className="size-1.5 rounded-full bg-slate-200" />
            </div>
          </>
        )}
      </div>

      {config.leadFormEnabled ? (
        <LeadFormPreview config={config} />
      ) : (
        <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white p-3">
          <div className="flex-1 truncate rounded-[10px] border border-slate-300 px-2.5 py-2 text-[13px] text-slate-400">
            {config.inputPlaceholder.trim() || "Nhập câu hỏi của bạn..."}
          </div>
          <div
            className="flex w-10 shrink-0 items-center justify-center rounded-[10px] text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Send className="size-4" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Khớp với khối .leadform trong public/widget.js. */
function LeadFormPreview({ config }: { config: WidgetConfigValues }) {
  return (
    // Khớp với .leadform của widget thật: nhiều trường thì form tự cuộn.
    <div className="flex flex-col gap-2 overflow-y-auto border-t border-slate-200 bg-white p-3.5">
      <p className="text-[13px] font-semibold text-slate-900">
        {config.leadFormTitle.trim() || "Trước khi bắt đầu"}
      </p>
      <p className="text-xs text-slate-500">
        {config.leadFormDescription.trim() ||
          "Vui lòng để lại thông tin để chúng tôi tư vấn chính xác hơn."}
      </p>

      {[
        { key: "__name", label: config.leadFormNameLabel.trim() || "Họ và tên", required: true },
        {
          key: "__phone",
          label: config.leadFormPhoneLabel.trim() || "Số điện thoại",
          required: true,
        },
        ...config.leadFormFields.map((field) => ({
          key: field.key,
          label: field.label.trim() || "(chưa đặt nhãn)",
          required: field.required,
        })),
      ].map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-900">
            {field.label}
            {field.required ? <span className="text-red-600"> *</span> : null}
          </span>
          <div className="h-8 rounded-[10px] border border-slate-300" />
        </div>
      ))}

      <div
        className="mt-0.5 rounded-[10px] px-3 py-2 text-center text-[13px] font-semibold text-white"
        style={{ backgroundColor: config.primaryColor }}
      >
        {config.leadFormSubmitLabel.trim() || "Bắt đầu chat"}
      </div>
    </div>
  );
}

/**
 * Logo tenant là URL tuỳ ý nên có thể hỏng hoặc chưa gõ xong — rơi về chữ cái
 * đầu của tên bot đúng như widget thật làm khi không có logoUrl.
 */
function Avatar({
  logoUrl,
  botName,
}: {
  logoUrl: string | null;
  botName: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = logoUrl?.trim();
  const showImage = Boolean(url) && !failed;

  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-[13px] font-semibold">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL logo do tenant nhập, không nằm trong remotePatterns của next/image.
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        botName.charAt(0).toUpperCase()
      )}
    </span>
  );
}
