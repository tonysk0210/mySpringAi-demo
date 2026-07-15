import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";

// 將 API 回應統一轉成 ChatBox 可顯示的文字：字串直接使用，物件或陣列則格式化為 JSON。
function responseToText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// 依 Axios 錯誤類型產生顯示文字。
function errorToText(error) {
  // 切換頁面造成的主動取消不是失敗，不顯示錯誤訊息。
  if (axios.isCancel(error)) return null;

  // 已收到後端的非 2xx HTTP response：顯示 status；若有 response body，再換行顯示內容。
  if (error.response) {
    const detail = responseToText(error.response.data);
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ""}`;
  }

  // Request 已送出但沒有收到 response，通常代表後端未啟動、網路或 timeout 問題。
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";

  // 其他 request 建立錯誤優先顯示原始 message，沒有時使用預設訊息。
  return error.message || "建立請求時發生錯誤。";
}

// requiresUserName 預設為 false；Page 寫 <ChatBox requiresUserName /> 等同傳入 true。
function ChatBox({ title, description, endpoint, requiresUserName = false }) {
  // Context：目前使用者、完整訊息集合，以及更新訊息的 setter。
  const { userName, messagesByUserAndEndpoint, setMessagesByUserAndEndpoint } =
    useDemo();
  // input：輸入框文字。
  const [input, setInput] = useState("");
  // isLoading：API request 是否進行中。
  const [isLoading, setIsLoading] = useState(false);
  // validationError：送出前的驗證錯誤訊息。
  const [validationError, setValidationError] = useState("");
  // controllerRef：目前 request 的 AbortController，供離開頁面時取消請求。
  const controllerRef = useRef(null);
  // messagesEndRef：訊息區底部 DOM，供自動捲動使用。
  const messagesEndRef = useRef(null);
  // userKey：整理 userName；空白名稱統一歸類為 anonymous。
  const userKey = userName.trim() || "anonymous";
  // messages：目前使用者在目前 endpoint 的歷史訊息。
  const messages = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[endpoint] || [],
    [endpoint, messagesByUserAndEndpoint, userKey],
  );

  // 訊息或 loading 狀態改變時，平滑捲動到訊息區底部。
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 掛載時註冊 cleanup；ChatBox 卸載時讀取最新 controllerRef 並取消未完成的 request。清理副作用並避免處理過期回應。
  useEffect(() => () => controllerRef.current?.abort(), []);

  // 將新訊息追加到目前 userName -> endpoint 的歷史訊息中。
  function appendMessage(message) {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [endpoint]: [...(current[userKey]?.[endpoint] || []), message],
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;
    if (requiresUserName && !userName.trim()) {
      setValidationError("請先在 Demo 欄位中 輸入使用者名稱。");
      return;
    }

    setValidationError("");
    setInput("");
    appendMessage({ role: "user", content: message });
    setIsLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await apiClient.post(
        endpoint,
        { message },
        {
          headers: requiresUserName ? { userName: userName.trim() } : undefined,
          signal: controller.signal,
        },
      );
      appendMessage({
        role: "assistant",
        content: responseToText(response.data),
      });
    } catch (error) {
      const errorMessage = errorToText(error);
      if (errorMessage) appendMessage({ role: "error", content: errorMessage });
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function clearMessages() {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [endpoint]: [],
      },
    }));
  }

  return (
    <article className="api-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <code>{endpoint}</code>
      </header>

      <section className="chat-panel">
        <div className="chat-toolbar">
          <div>
            <span className="status-dot" /> Ready
            {requiresUserName && (
              <span className="user-chip">user: {userName || "not set"}</span>
            )}
          </div>
          <button
            type="button"
            onClick={clearMessages}
            disabled={!messages.length || isLoading}
          >
            Clear
          </button>
        </div>

        <div className="messages" aria-live="polite">
          {!messages.length && (
            <div className="empty-chat">
              <span>✦</span>
              <h2>Start testing this endpoint</h2>
              <p>Type a message below to send your first request.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              className={`message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              <strong>
                {message.role === "user"
                  ? "You"
                  : message.role === "error"
                    ? "Error"
                    : "Assistant"}
              </strong>
              <pre>{message.content}</pre>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant typing">
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {validationError && (
            <p className="validation-error">{validationError}</p>
          )}
          <div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a message…"
              rows="3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              {isLoading ? "…" : "↑"}
            </button>
          </div>
          <small>Enter to send · Shift + Enter for a new line</small>
        </form>
      </section>
    </article>
  );
}

export default ChatBox;
