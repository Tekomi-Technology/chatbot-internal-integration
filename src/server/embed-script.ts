import type { WidgetMode } from "@/generated/prisma/enums";

export type EmbedSnippetInput = {
  appUrl: string;
  apiKey: string;
  mode: WidgetMode;
};

/**
 * Sinh đoạn `<script>` để tenant dán vào website của họ.
 *
 * `data-mode` ở đây chỉ là giá trị mặc định lúc tải trang; widget vẫn gọi
 * `/api/widget/config` và ưu tiên mode lưu trong dashboard, nên admin đổi mode
 * mà không cần tenant dán lại script.
 */
export function buildEmbedSnippet({
  appUrl,
  apiKey,
  mode,
}: EmbedSnippetInput): string {
  const scriptTag = [
    "<script",
    `  src="${appUrl}/widget.js"`,
    `  data-api-key="${apiKey}"`,
    `  data-mode="${mode.toLowerCase()}"`,
    mode === "INLINE" ? '  data-target="#chatbot-container"' : null,
    "  defer",
    "></script>",
  ]
    .filter(Boolean)
    .join("\n");

  if (mode === "INLINE") {
    return [
      "<!-- Đặt div này ở vị trí muốn hiển thị khung chat -->",
      '<div id="chatbot-container" style="height: 600px"></div>',
      "",
      scriptTag,
    ].join("\n");
  }

  return [
    "<!-- Dán ngay trước thẻ </body> -->",
    scriptTag,
  ].join("\n");
}
