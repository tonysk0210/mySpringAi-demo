import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";
import { apiTestGuides } from "../config/apiTestGuides";

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
  // textareaRef：輸入框 DOM，供送出訊息後自動聚焦使用。
  const textareaRef = useRef(null);
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

  // 進入頁面或送出完成時將焦點放回輸入框，方便使用者連續輸入。
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

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
    // 阻止 form 預設重新整理頁面，改由 JavaScript 處理送出。
    event.preventDefault();

    // 整理並驗證輸入；空訊息、request 進行中或缺少必要 userName 時停止。
    const message = input.trim();
    if (!message || isLoading) return;
    if (requiresUserName && !userName.trim()) {
      setValidationError("請先在 Demo 欄位中 輸入使用者名稱。");
      return;
    }

    // 清除表單狀態，立即顯示使用者訊息並進入 loading。
    setValidationError("");
    setInput("");
    appendMessage({ role: "user", content: message });
    setIsLoading(true);

    // 為本次 request 建立取消控制器，供 ChatBox 卸載時中止請求。
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 傳送訊息；需要身分的 API 額外附上 userName header。
      const response = await apiClient.post(
        endpoint,
        { message },
        {
          headers: requiresUserName ? { userName: userName.trim() } : undefined,
          // Axios 取消訊號（不是 HTTP header）；初始 aborted=false，呼叫 abort() 後變為 true 並中止 request。
          signal: controller.signal,
        },
      );

      // 成功時將後端回應轉成文字並加入 Assistant 訊息。
      appendMessage({
        role: "assistant",
        content: responseToText(response.data),
      });
    } catch (error) {
      // 將 Axios 錯誤轉成可顯示訊息；主動取消時不顯示錯誤。
      const errorMessage = errorToText(error);
      if (errorMessage) appendMessage({ role: "error", content: errorMessage });
    } finally {
      // 正常完成或失敗時結束 loading；卸載造成的取消不再更新 state。
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  // Enter 送出、Shift+Enter 換行；preventDefault 擋掉 textarea 預設換行，requestSubmit 才會觸發 form 的 onSubmit。
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  // 清空目前 userName -> endpoint 的訊息；層層 spread 以保留其他使用者與其他端點的資料。
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
            Clear Chat 清除對話
          </button>
        </div>

        {/* 訊息區由 4 個獨立表達式組成，各自判斷是否顯示；①②互斥、②③可同時顯示（例如：已有訊息且正在等新回應）。 */}
        <div className="messages" aria-live="polite">
          {/* ① 空狀態：沒有任何訊息時顯示引導畫面 + 該 API 的測試說明（若有設定於 apiTestGuides）。 */}
          {!messages.length && (
            <div className="empty-chat">
              <span>✦</span>
              <h2>開始測試這個 API 端點</h2>
              <p>在下方輸入訊息，送出你的第一個請求。</p>
              {/*
                為什麼要用 apiTestGuides[endpoint] 而不是 apiTestGuides.endpoint？
                1. endpoint 是「變數」（由 props 動態傳入，例如 "/rag/rag"、"/openai/chat-jdbc"）；
                   點語法只會找字面上叫 "endpoint" 的欄位，永遠回傳 undefined。
                2. key 名稱含斜線 "/"，斜線不能出現在點語法後面（會被解析成除法），
                   即使寫死也只能用 apiTestGuides["/rag/rag"]。
                方括號語法會先「計算」括號內的表達式再拿結果當 key，因此才能正確查到。
              */}
              {apiTestGuides[endpoint] && (
                <div
                  className="test-guide"
                  role="note"
                  aria-label="API 測試說明"
                >
                  <p className="test-guide-summary">
                    {apiTestGuides[endpoint].summary}
                  </p>
                  {apiTestGuides[endpoint].testPoints?.length > 0 && (
                    <>
                      <p className="test-guide-heading">🎯 測試重點</p>
                      <ul>
                        {apiTestGuides[endpoint].testPoints.map((point, i) => (
                          <li key={`tp-${i}`}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {apiTestGuides[endpoint].sampleQueries?.length > 0 && (
                    <>
                      <p className="test-guide-heading">💬 建議提問</p>
                      <ul>
                        {apiTestGuides[endpoint].sampleQueries.map((q, i) => (
                          <li key={`sq-${i}`}>
                            <button
                              type="button"
                              className="sample-query"
                              onClick={() => setInput(q)}
                              disabled={isLoading}
                              title="點擊填入輸入框"
                            >
                              {q}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {apiTestGuides[endpoint].notes && (
                    <p className="test-guide-notes">
                      ⚠️ {apiTestGuides[endpoint].notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ② 訊息列表：逐一渲染每則訊息；空陣列 map 回傳空結果，自然不顯示。key 用於 React 辨識列表元素。 */}
          {messages.map((message, index) => (
            <div
              className={`message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              {/* 依 role 決定發話者標籤：user→You、error→Error、其他→Assistant。 */}
              <strong>
                {message.role === "user"
                  ? "You"
                  : message.role === "error"
                    ? "Error"
                    : "Assistant"}
              </strong>
              {/* pre 保留換行與空白，適合顯示多行文字或 JSON。 */}
              <pre>{message.content}</pre>
            </div>
          ))}
          {/* ③ 打字中動畫：等待後端回應時顯示三個閃動的點。 */}
          {isLoading && (
            <div className="message assistant typing">
              <i />
              <i />
              <i />
            </div>
          )}
          {/* ④ 捲動錨點：永遠存在的空 div，供 useEffect 呼叫 scrollIntoView 捲到底部。 */}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {/* 送出前的驗證錯誤提示（例如 "請先在 Demo 欄位中 輸入使用者名稱。"）；有訊息時才顯示。 */}
          {validationError && (
            <p className="validation-error">{validationError}</p>
          )}
          <div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入訊息…"
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
          <small>Enter 送出 · Shift + Enter 換行</small>
        </form>
      </section>
    </article>
  );
}

export default ChatBox;
