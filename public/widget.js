
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
  var STATE_KEY = STORAGE_PREFIX + "state";

  /** Tăng số này khi đổi hình dạng dữ liệu lưu — bản cũ sẽ bị bỏ, không cố đọc. */
  var STATE_VERSION = 2;

  /** Hạn trượt: tính từ lần hoạt động CUỐI, không phải lần đầu. */
  var STATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  /**
   * Chỉ giữ ngần này tin gần nhất.
   *
   * Widget chạy trên website của khách hàng nên dùng chung hạn mức localStorage
   * (~5MB) với chính site đó. Không giới hạn là có ngày làm hỏng site người ta.
   */
  var MAX_STORED_MESSAGES = 50;

  function clearState() {
    try {
      window.localStorage.removeItem(STATE_KEY);
    } catch {
      /* bỏ qua */
    }
  }

  /** Bỏ mọi bản ghi méo mó. Dữ liệu này người dùng sửa tay được, đừng tin. */
  function sanitizeMessages(list) {
    var out = [];
    if (!Array.isArray(list)) return out;

    for (var i = 0; i < list.length; i += 1) {
      var item = list[i];
      if (!item || (item.r !== "u" && item.r !== "b" && item.r !== "s")) continue;
      if (typeof item.t !== "string" || !item.t) continue;
      if (typeof item.c !== "string" || !item.c) continue;
      out.push({ r: item.r, t: item.t, c: item.c });
    }

    return out.slice(-MAX_STORED_MESSAGES);
  }

  function readState() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(STATE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;

    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      clearState();
      return null;
    }

    if (!parsed || parsed.v !== STATE_VERSION) {
      clearState();
      return null;
    }

    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > STATE_TTL_MS
    ) {
      clearState();
      return null;
    }

    return parsed;
  }

  var stored = readState();

  var sessionId =
    (stored && typeof stored.sessionId === "string" && stored.sessionId) ||
    "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  var conversationId =
    (stored && typeof stored.conversationId === "string" && stored.conversationId) ||
    null;

  var history = stored ? sanitizeMessages(stored.messages) : [];

  /**
   * Đã điền form thu thập thông tin chưa.
   *
   * Sống chung chỗ với `sessionId` là CỐ Ý. Lead ghi vào DB theo khoá
   * `(tenantId, sessionId)`, nên cờ này phải có đúng tuổi thọ của `sessionId` —
   * để ở `sessionStorage` thì tab mới sẽ hỏi lại người đã điền rồi, rồi ghi đè
   * lên chính dòng lead cũ của họ.
   */
  var leadDone = Boolean(stored && stored.leadDone);

  /**
   * Chỉ ghi khi thật sự có gì để nhớ.
   *
   * Cố ý KHÔNG ghi lúc khởi tạo: khách chỉ lướt qua trang mà không mở chat thì
   * không nên để lại gì trong máy họ, và hạn 30 ngày cũng không nên trượt vì
   * một lượt xem trang.
   */
  function saveState() {
    try {
      window.localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          v: STATE_VERSION,
          savedAt: Date.now(),
          sessionId: sessionId,
          conversationId: conversationId,
          leadDone: leadDone,
          messages: history,
        }),
      );
    } catch {
      /* Hết hạn mức hoặc trình duyệt chặn storage. Widget vẫn chạy, chỉ không nhớ. */
    }
  }

  function rememberConversation(id) {
    if (!id || id === conversationId) return;
    conversationId = id;
    saveState();
  }

  function recordMessage(role, text, createdAt) {
    history.push({ r: role, t: text, c: createdAt || new Date().toISOString() });
    if (history.length > MAX_STORED_MESSAGES) {
      history = history.slice(-MAX_STORED_MESSAGES);
    }
    saveState();
  }

  function hasSubmittedLead() {
    return leadDone;
  }

  function rememberLead() {
    leadDone = true;
    saveState();
  }

  var VN_MOBILE = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

  function isValidPhone(value) {
    return VN_MOBILE.test(value.replace(/[\s.\-()]/g, ""));
  }

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
      ".msg--staff { align-self: flex-start; background: #eff6ff; border: 1px solid #bfdbfe; }",
      ".msg--pending { align-self: flex-start; background: #f8fafc; color: #64748b; border: 1px dashed #cbd5e1; font-style: italic; }",

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

      ".leadform {",
      "  display: flex; flex-direction: column; gap: 8px; padding: 14px;",
      "  border-top: 1px solid #e2e8f0; background: #fff;",
      "  overflow-y: auto;",
      "}",
      ".leadform__title { font-weight: 600; }",
      ".leadform__desc { margin: 0; font-size: 13px; color: #64748b; }",
      ".leadform label { font-size: 13px; font-weight: 500; }",
      ".leadform__req { color: #dc2626; }",
      ".leadform input {",
      "  border: 1px solid #cbd5e1; border-radius: 10px; padding: 9px 11px;",
      "  font: inherit; color: inherit; outline: none; width: 100%;",
      "}",
      ".leadform input:focus { border-color: var(--primary); }",
      ".leadform input[aria-invalid='true'] { border-color: #dc2626; }",
      ".leadform__error { margin: 0; font-size: 13px; color: #b91c1c; }",
      ".leadform__error[hidden] { display: none; }",
      ".leadform__submit {",
      "  margin-top: 2px; border: 0; border-radius: 10px; padding: 10px 12px;",
      "  background: var(--primary); color: #fff; font: inherit; font-weight: 600;",
      "  cursor: pointer;",
      "}",
      ".leadform__submit:disabled { opacity: .6; cursor: not-allowed; }",
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

  function buildLeadForm(leadForm) {
    var form = el("form", "leadform", { novalidate: "novalidate" });

    var title = el("div", "leadform__title");
    title.textContent = leadForm.title || "Trước khi bắt đầu";
    form.appendChild(title);

    var desc = el("p", "leadform__desc");
    desc.textContent =
      leadForm.description ||
      "Vui lòng để lại thông tin để chúng tôi tư vấn chính xác hơn.";
    form.appendChild(desc);

    var fields = {};

    function addInput(spec) {
      var id = "leadform-" + spec.name;
      var label = el("label", null, { for: id });
      label.textContent = spec.label;
      if (spec.required) {
        var mark = el("span", "leadform__req");
        mark.textContent = " *";
        label.appendChild(mark);
      }

      var attrs = { id: id, name: spec.name, type: spec.type };
      if (spec.autocomplete) attrs.autocomplete = spec.autocomplete;
      var field = el("input", null, attrs);
      if (spec.required) field.setAttribute("aria-required", "true");
      if (spec.type === "tel") field.setAttribute("inputmode", "tel");

      form.appendChild(label);
      form.appendChild(field);
      return field;
    }

    fields.fullName = addInput({
      name: "fullName",
      label: leadForm.nameLabel || "Họ và tên",
      type: "text",
      autocomplete: "name",
      required: true,
    });

    fields.phone = addInput({
      name: "phone",
      label: leadForm.phoneLabel || "Số điện thoại",
      type: "tel",
      autocomplete: "tel",
      required: true,
    });

    var extra = [];
    var extraSpecs = Array.isArray(leadForm.fields) ? leadForm.fields : [];

    extraSpecs.forEach(function (spec, index) {
      if (!spec || !spec.key || !spec.label) return;
      var type = spec.type === "email" ? "email" : "text";
      extra.push({
        key: spec.key,
        label: spec.label,
        type: type,
        required: Boolean(spec.required),
        input: addInput({
          name: "extra" + index,
          label: spec.label,
          type: type,
          autocomplete: type === "email" ? "email" : null,
          required: Boolean(spec.required),
        }),
      });
    });

    var errorEl = el("p", "leadform__error", { role: "alert" });
    errorEl.hidden = true;
    form.appendChild(errorEl);

    var submitBtn = el("button", "leadform__submit", { type: "submit" });
    submitBtn.textContent = leadForm.submitLabel || "Bắt đầu chat";
    form.appendChild(submitBtn);

    form.fields = fields;
    form.extra = extra;
    form.errorEl = errorEl;
    form.submitBtn = submitBtn;
    return form;
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
        stopPolling();
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

    var leadForm = config.leadForm || {};
    var leadGateOn = Boolean(leadForm.enabled) && !hasSubmittedLead();
    var leadEl = leadGateOn ? buildLeadForm(leadForm) : null;

    panel.appendChild(leadEl || composer);

    root.appendChild(panel);

    function focusFirstField() {
      if (leadEl) leadEl.fields.fullName.focus();
      else input.focus();
    }

    if (mode === "bubble") {
      var launcher = el("button", "launcher", {
        type: "button",
        "data-position": position,
        "aria-label": "Mở cửa sổ chat",
      });
      launcher.innerHTML = ICON_CHAT;
      launcher.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) {
          focusFirstField();
          startPolling();
        } else {
          stopPolling();
        }
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

    // Tin chào CHỈ hiện khi chưa có lịch sử. Nếu không, mỗi lần khách tải lại
    // trang là thêm một lời chào nữa chồng lên đoạn chat cũ.
    function roleToVariant(role) {
      if (role === "u") return "user";
      if (role === "s") return "staff";
      return "bot";
    }

    if (history.length > 0) {
      for (var h = 0; h < history.length; h += 1) {
        addMessage(history[h].t, roleToVariant(history[h].r));
      }
    } else if (config.welcomeMessage) {
      addMessage(config.welcomeMessage, "bot");
    }

    var sendingLead = false;

    function showLeadError(message, invalidField) {
      leadEl.errorEl.textContent = message;
      leadEl.errorEl.hidden = false;
      if (invalidField) {
        invalidField.setAttribute("aria-invalid", "true");
        invalidField.focus();
      }
    }

    function clearLeadError() {
      leadEl.errorEl.hidden = true;
      leadEl.fields.fullName.removeAttribute("aria-invalid");
      leadEl.fields.phone.removeAttribute("aria-invalid");
      leadEl.extra.forEach(function (entry) {
        entry.input.removeAttribute("aria-invalid");
      });
    }

    function collectExtra() {
      var values = {};

      for (var i = 0; i < leadEl.extra.length; i += 1) {
        var entry = leadEl.extra[i];
        var text = entry.input.value.trim();

        if (!text) {
          if (entry.required) {
            showLeadError(
              "Vui lòng nhập " + entry.label.toLowerCase() + ".",
              entry.input,
            );
            return null;
          }
          continue;
        }

        if (entry.type === "email" && !EMAIL.test(text)) {
          showLeadError(
            entry.label + " chưa đúng định dạng. Ví dụ: ten@congty.com.",
            entry.input,
          );
          return null;
        }

        values[entry.key] = text;
      }

      return values;
    }

    function unlockComposer(fullName) {
      rememberLead();
      leadEl.remove();
      leadEl = null;
      panel.appendChild(composer);
      addMessage("Cảm ơn " + fullName + "! Bạn cần tư vấn về vấn đề gì ạ?", "bot");
      input.focus();
    }

    function submitLead() {
      if (sendingLead) return;
      clearLeadError();

      var fullName = leadEl.fields.fullName.value.trim();
      var phone = leadEl.fields.phone.value.trim();

      if (fullName.length < 2) {
        showLeadError("Vui lòng nhập họ tên của bạn.", leadEl.fields.fullName);
        return;
      }
      if (!isValidPhone(phone)) {
        showLeadError(
          "Số điện thoại không hợp lệ. Ví dụ: 0912345678.",
          leadEl.fields.phone,
        );
        return;
      }

      var extraValues = collectExtra();
      if (!extraValues) return;

      sendingLead = true;
      leadEl.submitBtn.disabled = true;

      fetch(origin + "/api/widget/lead", {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          fullName: fullName,
          phone: phone,
          sessionId: sessionId,
          pageUrl: window.location.href,
          extra: extraValues,
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
          if (!result.ok) {
            showLeadError(
              result.payload.message || "Không gửi được thông tin, vui lòng thử lại.",
            );
            return;
          }
          unlockComposer(fullName);
        })
        .catch(function (error) {
          console.error("[chatbot] Gửi thông tin liên hệ thất bại.", error);
          showLeadError("Không kết nối được tới máy chủ. Vui lòng thử lại.");
        })
        .finally(function () {
          sendingLead = false;
          if (leadEl) leadEl.submitBtn.disabled = false;
        });
    }

    if (leadEl) {
      leadEl.addEventListener("submit", function (event) {
        event.preventDefault();
        submitLead();
      });
      leadEl.fields.fullName.addEventListener("input", clearLeadError);
      leadEl.fields.phone.addEventListener("input", clearLeadError);
      leadEl.extra.forEach(function (entry) {
        entry.input.addEventListener("input", clearLeadError);
      });
    }


    var POLL_INTERVAL_MS = 4000;
    var pollTimer = null;
    var lastSeenAt =
      history.length > 0 ? history[history.length - 1].c : new Date().toISOString();

    function pollForNewMessages() {
      fetch(
        origin +
          "/api/widget/messages?sessionId=" +
          encodeURIComponent(sessionId) +
          "&since=" +
          encodeURIComponent(lastSeenAt),
        {
          method: "GET",
          credentials: "omit",
          headers: { "X-Api-Key": apiKey },
        },
      )
        .then(function (response) {
          if (!response.ok) return null;
          return response.json();
        })
        .then(function (payload) {
          if (!payload || !Array.isArray(payload.messages)) return;
          for (var i = 0; i < payload.messages.length; i += 1) {
            var item = payload.messages[i];
            if (!item || (item.sender !== "STAFF" && item.sender !== "BOT")) continue;
            var role = item.sender === "STAFF" ? "s" : "b";
            addMessage(item.text, role === "s" ? "staff" : "bot");
            recordMessage(role, item.text, item.createdAt);
            lastSeenAt = item.createdAt;
          }
        })
        .catch(function () {
          /* im lặng, thử lại ở lượt sau */
        });
    }

    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(pollForNewMessages, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (!pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
    }

    var sending = false;

    function setSending(value) {
      sending = value;
      sendBtn.disabled = value;
      input.disabled = value;
    }

    function send(text) {
      addMessage(text, "user");
      recordMessage("u", text);
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
          if (result.payload.status === "pending_staff") {
            addMessage("Đang chờ nhân viên phản hồi...", "pending");
            return;
          }
          rememberConversation(result.payload.conversationId);
          var answer =
            result.payload.answer || "(Trợ lý không trả về nội dung nào.)";
          addMessage(answer, "bot");
          recordMessage("b", answer, result.payload.createdAt);
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

    if (mode === "inline") startPolling();
  }
})();
