import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";

// 本頁後端 endpoint；同時用於 API 呼叫、slot 的 key、以及頁面顯示。
const ENDPOINT = "/image/image";

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

  // slot：這頁「上次操作留下的紀錄」，存在 Context state 裡。
  // 內容是兩個物件：第一個是使用者上次輸入的 prompt，第二個是 AI 回傳的圖片或錯誤訊息；
  // 從沒操作過就是 []。切到別頁再回來、或按 F5 都能看到上次的內容；每次生成整組覆蓋。
  const slot = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[ENDPOINT] || [],
    [messagesByUserAndEndpoint, userKey],
  );

  // 從 slot 拿出兩塊資料，分別用在兩個地方：
  //   savedInput   → 用來把「上次填的 prompt」填回下方輸入框
  //   latestResult → 用來把「上次生成的圖片或錯誤訊息」顯示在畫面中間
  const savedInput = slot.find((m) => m.role === "user");
  const latestResult = slot.find(
    (m) => m.role === "assistant" || m.role === "error",
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

  // 進入頁面或送出完成後將焦點放回輸入框。
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  // 覆寫（非累積）本 endpoint 在 Context state 中的 slot；spread 保留其他使用者與其他 endpoint 的資料。
  function writeSlot(next) {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [ENDPOINT]: next,
      },
    }));
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
      // 後端 payload 只需 message；回傳 { imageBase64, savedPath }。
      const response = await apiClient.post(
        ENDPOINT,
        { message },
        { signal: controller.signal },
      );
      // 成功：整組覆蓋 slot，assistant 位置存 imageBase64 與 savedPath。
      writeSlot([
        { role: "user", prompt: message },
        {
          role: "assistant",
          imageBase64: response.data.imageBase64,
          savedPath: response.data.savedPath,
        },
      ]);
    } catch (error) {
      const errorMessage = errorToText(error);
      // 失敗：同樣整組覆蓋 slot，assistant 位置換成 error；主動取消時不寫入。
      if (errorMessage) {
        writeSlot([
          { role: "user", prompt: message },
          { role: "error", content: errorMessage },
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

  const hasResult = !!latestResult;

  return (
    <article className="api-page">
      {/* 頁面標頭：POST endpoint 標記、標題、描述。 */}
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>Generate Image</h1>
          <p>輸入文字描述，用 OpenAI Image 預設模型與尺寸生成一張圖片。</p>
        </div>
        <code>{ENDPOINT}</code>
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
            Clear image 清除暫存圖片
          </button>
        </div>

        {/* 訊息區四段：空狀態、圖片結果、錯誤訊息、loading 動畫。 */}
        <div className="messages" aria-live="polite">
          {/* ① 空狀態：從未生成過且非 loading 時顯示引導。 */}
          {!hasResult && !isLoading && (
            <div className="empty-chat">
              <span>✦</span>
              <h2>準備生成圖片</h2>
              <p>在下方輸入描述，按下 Generate 送出。</p>
            </div>
          )}
          {/* ② 成功結果：base64 內嵌成 <img>，下方顯示後端寫檔路徑。 */}
          {hasResult && latestResult.role === "assistant" && (
            <div className="message assistant">
              <strong>Assistant</strong>
              <img
                className="generated-image"
                src={`data:image/png;base64,${latestResult.imageBase64}`}
                alt="Generated"
              />
              <p className="saved-path">Saved to: {latestResult.savedPath}</p>
            </div>
          )}
          {/* ③ 失敗結果：顯示 errorToText 產生的訊息。 */}
          {hasResult && latestResult.role === "error" && (
            <div className="message error">
              <strong>Error</strong>
              <pre>{latestResult.content}</pre>
            </div>
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
