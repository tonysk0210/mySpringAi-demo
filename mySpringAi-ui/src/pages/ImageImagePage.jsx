import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { apiTestGuides } from "../config/apiTestGuides";
import { useDemo } from "../context/useDemo";

// 本頁後端 endpoint；同時用於 API 呼叫、slot 的 key、以及頁面顯示。
const ENDPOINT = "/image/image";
const TEST_GUIDE = apiTestGuides[ENDPOINT];

// 後端回傳不含 API base URL 的資源路徑；補上 Axios 共用 baseURL，讓 Vite proxy 與正式環境都走相同入口。
function toApiImageUrl(imageUrl) {
  const baseUrl = (apiClient.defaults.baseURL || "").replace(/\/$/, "");
  const resourcePath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${resourcePath}`;
}

// 將 API 回應轉成可顯示文字：字串直接使用，物件/陣列則格式化為 JSON。
function responseToText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// 依 Axios 錯誤類型產生顯示文字。
function errorToText(error) {
  // 切頁面造成的主動取消不是失敗，回傳 null 讓呼叫端跳過顯示。
  if (axios.isCancel(error)) return null;
  // 已收到非 2xx response：顯示 status，有 body 時附上內容。
  if (error.response) {
    const detail = responseToText(error.response.data);
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ""}`;
  }
  // request 已送出但沒收到 response，通常是後端未啟動或網路/timeout。
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";
  return error.message || "建立請求時發生錯誤。";
}

export default function ImageImagePage() {
  // Context：跨頁共用的訊息 state 及其 setter；DemoContext 會自動把它鏡射到 sessionStorage。
  const { userName, messagesByUserAndEndpoint, setMessagesByUserAndEndpoint } =
    useDemo();
  const userKey = userName.trim() || "anonymous";

  // slot：本頁歷次生成紀錄，存在 Context state 並同步至 sessionStorage。
  // 每次生成會追加 user + assistant/error，不覆蓋先前圖片；切頁或重新整理後仍可還原 URL 歷史。
  const slot = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[ENDPOINT] || [],
    [messagesByUserAndEndpoint, userKey],
  );

  // 輸入框回填最後一次 prompt；結果區則顯示所有 URL 圖片與錯誤紀錄。
  const savedInput = slot.filter((message) => message.role === "user").at(-1);
  const results = slot.filter(
    (message) =>
      (message.role === "assistant" && message.imageUrl) ||
      message.role === "error",
  );

  // 輸入框綁定的 state；第一次打開頁面時用 savedInput 填回上次的值，沒有就空字串。
  const [prompt, setPrompt] = useState(savedInput?.prompt || "");
  const [isLoading, setIsLoading] = useState(false);
  // controllerRef：目前 request 的 AbortController，供離開頁面時取消請求。
  const controllerRef = useRef(null);
  // textareaRef：輸入框 DOM，送出後自動聚焦以便連續操作。
  const textareaRef = useRef(null);

  // 元件卸載時取消未完成的 request，避免處理過期回應。
  useEffect(() => () => controllerRef.current?.abort(), []);

  // 舊版曾把完整 Base64 放入 sessionStorage；載入頁面時移除舊格式，避免繼續占用瀏覽器配額。
  useEffect(() => {
    setMessagesByUserAndEndpoint((current) => {
      const currentSlot = current[userKey]?.[ENDPOINT] || [];
      if (!currentSlot.some((message) => message.imageBase64)) return current;

      return {
        ...current,
        [userKey]: {
          ...(current[userKey] || {}),
          [ENDPOINT]: currentSlot.filter((message) => !message.imageBase64),
        },
      };
    });
  }, [setMessagesByUserAndEndpoint, userKey]);

  // 進入頁面或送出完成後將焦點放回輸入框。
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  // 覆寫本 endpoint 的 slot，供 Clear 使用。
  function writeSlot(next) {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [ENDPOINT]: next,
      },
    }));
  }

  // 追加一次生成紀錄；以 setter 取得最新 state，避免非同步回應覆蓋既有歷史。
  function appendSlot(entries) {
    setMessagesByUserAndEndpoint((current) => {
      const currentSlot = current[userKey]?.[ENDPOINT] || [];
      return {
        ...current,
        [userKey]: {
          ...(current[userKey] || {}),
          [ENDPOINT]: [...currentSlot, ...entries],
        },
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // 整理輸入；request 進行中則忽略（按鈕 disabled 已擋掉空白輸入）。
    const message = prompt.trim();
    if (isLoading) return;

    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 後端 payload 只需 message；回傳唯一圖片的 { imageUrl }。
      const response = await apiClient.post(
        ENDPOINT,
        { message },
        { signal: controller.signal },
      );
      // 成功：將 prompt 與圖片 URL 追加至歷史；Context/sessionStorage 不再保存 Base64。
      appendSlot([
        { role: "user", prompt: message },
        {
          role: "assistant",
          prompt: message,
          imageUrl: toApiImageUrl(response.data.imageUrl),
        },
      ]);
    } catch (error) {
      const errorMessage = errorToText(error);
      // 失敗也追加至歷史；主動取消時不寫入。
      if (errorMessage) {
        appendSlot([
          { role: "user", prompt: message },
          { role: "error", prompt: message, content: errorMessage },
        ]);
      }
    } finally {
      // 卸載造成的取消不再更新 state；正常結束或錯誤則關掉 loading。
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  // 清空輸入框與 slot。
  function clearAll() {
    setPrompt("");
    writeSlot([]);
  }

  const hasResult = results.length > 0;

  return (
    <article className="api-page">
      {/* 頁面標頭：POST endpoint 標記、標題、描述。 */}
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>Generate Image</h1>
          <p>輸入文字描述，用 OpenAI Image 預設模型與尺寸生成一張圖片。</p>
        </div>
        <code>API 端口：{ENDPOINT}</code>
      </header>

      <section className="chat-panel">
        {/* 工具列：狀態指示 + Clear 按鈕（loading 中或沒東西可清時 disable）。 */}
        <div className="chat-toolbar">
          <div>
            <span className="status-dot" /> Ready
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={isLoading || (!hasResult && !prompt)}
          >
            Clear images 清除圖片紀錄
          </button>
        </div>

        {/* 訊息區四段：空狀態、圖片結果、錯誤訊息、loading 動畫。 */}
        <div className="messages" aria-live="polite">
          {/* ① 空狀態：從未生成過且非 loading 時顯示引導。 */}
          {!hasResult && !isLoading && (
            <div className="empty-chat">
              <span aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="8.5" cy="9" r="1.5" />
                  <path d="m4 17 5-5 4 4 2-2 5 4" />
                </svg>
              </span>
              <h2>準備生成圖片</h2>
              <p>在下方輸入描述，按下 Generate 送出。</p>
              {TEST_GUIDE && (
                <div
                  className="test-guide"
                  role="note"
                  aria-label="API 測試說明"
                >
                  <p className="test-guide-summary">{TEST_GUIDE.summary}</p>
                  {TEST_GUIDE.testPoints?.length > 0 && (
                    <>
                      <p className="test-guide-heading">🎯 測試重點</p>
                      <ul>
                        {TEST_GUIDE.testPoints.map((point, index) => (
                          <li key={`tp-${index}`}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {TEST_GUIDE.sampleQueries?.length > 0 && (
                    <>
                      <p className="test-guide-heading">💬 建議提問</p>
                      <ul>
                        {TEST_GUIDE.sampleQueries.map((query, index) => (
                          <li key={`sq-${index}`}>
                            <button
                              type="button"
                              className="sample-query"
                              onClick={() => {
                                setPrompt(query);
                                textareaRef.current?.focus();
                              }}
                              title="點擊填入圖片描述"
                            >
                              {query}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {TEST_GUIDE.notes && (
                    <p className="test-guide-notes">⚠️ {TEST_GUIDE.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ②③ 歷史結果：成功顯示 URL 圖片與 prompt，失敗顯示 errorToText 產生的訊息。 */}
          {results.map((result, index) =>
            result.role === "assistant" ? (
              <div className="message assistant" key={result.imageUrl}>
                <strong>Assistant</strong>
                <img
                  className="generated-image"
                  src={result.imageUrl}
                  alt={result.prompt || "Generated"}
                />
                <p className="saved-path">Prompt: {result.prompt}</p>
              </div>
            ) : (
              <div className="message error" key={`error-${index}`}>
                <strong>Error</strong>
                <pre>{result.content}</pre>
              </div>
            ),
          )}
          {/* ④ loading：等待後端回應時的三點動畫；可與已有結果同時存在。 */}
          {isLoading && (
            <div className="message assistant typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A corgi flying through space…"
              rows="3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              aria-label="Generate image"
            >
              {isLoading ? "…" : "↑"}
            </button>
          </div>
          <small>填完描述後按 ↑ 送出</small>
        </form>
      </section>
    </article>
  );
}
