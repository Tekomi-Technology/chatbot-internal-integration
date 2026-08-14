
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) {
    console.error("[chatbot] Không xác định được thẻ <script> của widget.");
    return;
  }

  var apiKey = script.getAttribute("data-api-key");
  if (!apiKey) {
    console.error("[chatbot] Thiếu thuộc tính data-api-key.");
    return;
  }

  var origin = new URL(script.src, window.location.href).origin;
  var fallbackMode = (script.getAttribute("data-mode") || "bubble").toLowerCase();
  var targetSelector = script.getAttribute("data-target") || "#chatbot-container";

  var STORAGE_PREFIX = "chatbot:" + apiKey + ":";

  function getSessionId() {
    var key = STORAGE_PREFIX + "session";
    var value = null;
    try {
      value = window.sessionStorage.getItem(key);
    } catch {
    }
    if (!value) {
      value =
        "s_" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10);
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        /* bỏ qua */
      }
    }
    return value;
  }

  var sessionId = getSessionId();
  var conversationId = null;
  try {
    conversationId = window.sessionStorage.getItem(STORAGE_PREFIX + "conversation");
  } catch {
  }

  function rememberConversation(id) {
    if (!id || id === conversationId) return;
    conversationId = id;
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + "conversation", id);
    } catch {
      /* bỏ qua */
    }
  }

  function buildStyles(config) {
    return [
      ":host { all: initial; }",
      "*, *::before, *::after { box-sizing: border-box; }",
      ".root {",
      "  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
      "  font-size: 14px; line-height: 1.5; color: #0f172a;",
      "  --primary: " + config.primaryColor + ";",
      "}",
      ".root--inline { display: block; height: 100%; }",

      ".launcher {",
      "  position: fixed; bottom: 20px; z-index: 2147483000;",
      "  width: 56px; height: 56px; border: 0; border-radius: 9999px; cursor: pointer;",
      "  background: var(--primary); color: #fff;",
      "  box-shadow: 0 8px 24px rgba(15, 23, 42, .24);",
      "  display: flex; align-items: center; justify-content: center;",
      "  transition: transform .15s ease;",
      "}",
      ".launcher:hover { transform: scale(1.05); }",
      ".launcher[data-position='bottom-left'] { left: 20px; }",
      ".launcher[data-position='bottom-right'] { right: 20px; }",
      ".launcher svg { width: 26px; height: 26px; }",

      ".panel {",
      "  display: flex; flex-direction: column; overflow: hidden;",
      "  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;",
      "}",
      ".panel--floating {",
      "  position: fixed; bottom: 88px; z-index: 2147483000;",
      "  width: 380px; height: 560px; max-height: calc(100vh - 120px);",
      "  box-shadow: 0 18px 48px rgba(15, 23, 42, .2);",
      "}",
      ".panel--floating[data-position='bottom-left'] { left: 20px; }",
      ".panel--floating[data-position='bottom-right'] { right: 20px; }",
      ".panel--inline { width: 100%; height: 100%; min-height: 420px; }",
      ".panel[hidden] { display: none; }",

      "@media (max-width: 480px) {",
      "  .panel--floating { width: calc(100vw - 24px); right: 12px; left: 12px; bottom: 84px; }",
      "}",

      ".header {",
      "  display: flex; align-items: center; gap: 10px; padding: 12px 14px;",
      "  background: var(--primary); color: #fff; flex-shrink: 0;",
      "}",
      ".avatar {",
      "  width: 32px; height: 32px; border-radius: 9999px; flex-shrink: 0;",
      "  background: rgba(255, 255, 255, .22); object-fit: cover;",
      "  display: flex; align-items: center; justify-content: center;",
      "  font-weight: 600; font-size: 13px;",
      "}",
      ".title { font-weight: 600; font-size: 14px; flex: 1; min-width: 0; }",
      ".title span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
      ".close {",
      "  border: 0; background: transparent; color: inherit; cursor: pointer;",
      "  padding: 4px; border-radius: 6px; opacity: .85; line-height: 0;",
      "}",
      ".close:hover { opacity: 1; background: rgba(255, 255, 255, .16); }",
      ".close svg { width: 18px; height: 18px; }",

      ".messages {",
      "  flex: 1; overflow-y: auto; padding: 16px; display: flex;",
      "  flex-direction: column; gap: 10px; background: #f8fafc;",
      "  min-height: 56px;",
      "}",
      ".msg { max-width: 82%; padding: 9px 12px; border-radius: 12px; white-space: pre-wrap; word-wrap: break-word; }",
      ".msg--bot { align-self: flex-start; background: #fff; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }",
      ".msg--user { align-self: flex-end; background: var(--primary); color: #fff; border-bottom-right-radius: 4px; }",
      ".msg--error { align-self: flex-start; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }",

      ".typing { display: flex; gap: 4px; align-items: center; }",
      ".typing i {",
      "  width: 6px; height: 6px; border-radius: 9999px; background: #94a3b8;",
      "  animation: blink 1.2s infinite ease-in-out;",
      "}",
      ".typing i:nth-child(2) { animation-delay: .2s; }",
      ".typing i:nth-child(3) { animation-delay: .4s; }",
      "@keyframes blink { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }",

      ".composer {",
      "  display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e2e8f0;",
      "  background: #fff; flex-shrink: 0;",
      "}",
      ".composer textarea {",
      "  flex: 1; resize: none; border: 1px solid #cbd5e1; border-radius: 10px;",
      "  padding: 9px 11px; font: inherit; color: inherit; max-height: 96px;",
      "  outline: none;",
      "}",
      ".composer textarea:focus { border-color: var(--primary); }",
      ".send {",
      "  border: 0; border-radius: 10px; background: var(--primary); color: #fff;",
      "  width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;",
      "  flex-shrink: 0;",
      "}",
      ".send:disabled { opacity: .5; cursor: not-allowed; }",
      ".send svg { width: 18px; height: 18px; }",
    ].join("\n");
  }


  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (name) {
        node.setAttribute(name, attrs[name]);
      });
    }
    return node;
  }

  fetch(origin + "/api/widget/config?key=" + encodeURIComponent(apiKey), {
    method: "GET",
    credentials: "omit",
  })
    .then(function (response) {
      if (!response.ok) throw new Error("config " + response.status);
      return response.json();
    })
    .then(function (payload) {
      mount(payload.widget);
    })
    .catch(function (error) {
      console.error("[chatbot] Không tải được cấu hình widget.", error);
    });

  function mount(config) {
    var mode = (config.mode || fallbackMode) === "inline" ? "inline" : "bubble";

    var inlineTarget = mode === "inline" ? document.querySelector(targetSelector) : null;
    if (mode === "inline" && !inlineTarget) {
      console.warn(
        "[chatbot] Không tìm thấy " +
          targetSelector +
          " cho chế độ inline — tạm chuyển sang chế độ bubble.",
      );
      mode = "bubble";
    }

    var position = config.position === "bottom-left" ? "bottom-left" : "bottom-right";
    var host = el("div", null, { "data-chatbot-widget": mode });

    if (inlineTarget) {
      host.style.display = "block";
      host.style.height = "100%";
      inlineTarget.appendChild(host);
    } else {
      document.body.appendChild(host);
    }

    var shadow = host.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = buildStyles(config);
    shadow.appendChild(style);

    var root = el("div", "root" + (mode === "inline" ? " root--inline" : ""));
    shadow.appendChild(root);

    var panel = el(
      "div",
      "panel " + (mode === "inline" ? "panel--inline" : "panel--floating"),
      { "data-position": position },
    );
    if (mode === "bubble") panel.hidden = true;

    var header = el("div", "header");
    if (config.logoUrl) {
      var logo = el("img", "avatar", { src: config.logoUrl, alt: "" });
      header.appendChild(logo);
    } else {
      var initial = el("div", "avatar");
      initial.textContent = (config.botName || "AI").trim().charAt(0).toUpperCase();
      header.appendChild(initial);
    }

    var title = el("div", "title");
    var titleText = document.createElement("span");
    titleText.textContent = config.botName || "Trợ lý AI";
    title.appendChild(titleText);
    header.appendChild(title);

    if (mode === "bubble") {
      var closeBtn = el("button", "close", { type: "button", "aria-label": "Đóng" });
      closeBtn.innerHTML = ICON_CLOSE;
      header.appendChild(closeBtn);
      closeBtn.addEventListener("click", function () {
        panel.hidden = true;
      });
    }
    panel.appendChild(header);

    var messages = el("div", "messages", {
      role: "log",
      "aria-live": "polite",
    });
    panel.appendChild(messages);

    var composer = el("form", "composer");
    var input = el("textarea", null, {
      rows: "1",
      placeholder: config.inputPlaceholder || "Nhập câu hỏi của bạn...",
      "aria-label": "Nội dung tin nhắn",
    });
    var sendBtn = el("button", "send", { type: "submit", "aria-label": "Gửi" });
    sendBtn.innerHTML = ICON_SEND;
    composer.appendChild(input);
    composer.appendChild(sendBtn);

    panel.appendChild(composer);

    root.appendChild(panel);

    if (mode === "bubble") {
      var launcher = el("button", "launcher", {
        type: "button",
        "data-position": position,
        "aria-label": "Mở cửa sổ chat",
      });
      launcher.innerHTML = ICON_CHAT;
      launcher.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) input.focus();
      });
      root.appendChild(launcher);
    }

    function scrollToEnd() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, variant) {
      var bubble = el("div", "msg msg--" + variant);
      bubble.textContent = text;
      messages.appendChild(bubble);
      scrollToEnd();
      return bubble;
    }

    function addTypingIndicator() {
      var bubble = el("div", "msg msg--bot");
      var typing = el("div", "typing");
      typing.innerHTML = "<i></i><i></i><i></i>";
      bubble.appendChild(typing);
      messages.appendChild(bubble);
      scrollToEnd();
      return bubble;
    }

    if (config.welcomeMessage) addMessage(config.welcomeMessage, "bot");

    var sending = false;

    function setSending(value) {
      sending = value;
      sendBtn.disabled = value;
      input.disabled = value;
    }

    function send(text) {
      addMessage(text, "user");
      var indicator = addTypingIndicator();
      setSending(true);

      fetch(origin + "/api/widget/chat", {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          conversationId: conversationId,
        }),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (payload) {
              return { ok: response.ok, payload: payload };
            });
        })
        .then(function (result) {
          indicator.remove();
          if (!result.ok) {
            addMessage(
              result.payload.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
              "error",
            );
            return;
          }
          rememberConversation(result.payload.conversationId);
          addMessage(
            result.payload.answer || "(Trợ lý không trả về nội dung nào.)",
            "bot",
          );
        })
        .catch(function (error) {
          indicator.remove();
          console.error("[chatbot] Gửi tin nhắn thất bại.", error);
          addMessage("Không kết nối được tới máy chủ. Vui lòng thử lại.", "error");
        })
        .finally(function () {
          setSending(false);
          input.focus();
        });
    }

    composer.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text || sending) return;
      input.value = "";
      input.style.height = "auto";
      send(text);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        composer.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });

    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 96) + "px";
    });
  }
})();
