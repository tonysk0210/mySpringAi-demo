import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { apiTestGuides } from "../config/apiTestGuides";
import { useDemo } from "../context/useDemo";

const ENDPOINT = "/image/image-options";
const TEST_GUIDE = apiTestGuides[ENDPOINT];

// 後端回傳不含 API base URL 的資源路徑；補上 Axios 共用 baseURL，讓 Vite proxy 與正式環境都走相同入口。
function toApiImageUrl(imageUrl) {
  const baseUrl = (apiClient.defaults.baseURL || "").replace(/\/$/, "");
  const resourcePath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${resourcePath}`;
}

// 後端 ImageController 內建的 fallback 值（前端顯示用；需與後端保持同步）。
const DEFAULT_MODEL = "gpt-image-1";
const DEFAULT_QUALITY = "auto";
const DEFAULT_SIZE = "1024x1024";

// 三個下拉選單的候選值。畫面上會在等於 DEFAULT_* 的那個 option 右邊多顯示 "(default)"。
const MODELS = [
  "gpt-image-1",
  "gpt-image-1-mini",
  "gpt-image-1.5",
  "gpt-image-2",
];
const QUALITIES = ["auto", "low", "medium", "high"];
const SIZES = ["1024x1024", "1024x1536", "1536x1024", "1792x1024", "1024x1792"];

function responseToText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function errorToText(error) {
  if (axios.isCancel(error)) return null;
  if (error.response) {
    const detail = responseToText(error.response.data);
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ""}`;
  }
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";
  return error.message || "建立請求時發生錯誤。";
}

// 對應 DEFAULT_* 的 option 在原字串後標註 "(default)"，其餘照原字串顯示。
function optionLabel(value, defaultValue) {
  return value === defaultValue ? `${value} (default)` : value;
}

export default function ImageImageOptionsPage() {
  const { userName, messagesByUserAndEndpoint, setMessagesByUserAndEndpoint } =
    useDemo();
  const userKey = userName.trim() || "anonymous";

  const slot = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[ENDPOINT] || [],
    [messagesByUserAndEndpoint, userKey],
  );
  const savedInput = slot.filter((message) => message.role === "user").at(-1);
  const results = slot.filter(
    (message) =>
      (message.role === "assistant" && message.imageUrl) ||
      message.role === "error",
  );

  const [prompt, setPrompt] = useState(savedInput?.prompt || "");
  // options 三個下拉框的 state；初始值優先從 savedInput 回填，否則落到 DEFAULT_*。
  const [model, setModel] = useState(savedInput?.model || DEFAULT_MODEL);
  const [quality, setQuality] = useState(
    savedInput?.quality || DEFAULT_QUALITY,
  );
  const [size, setSize] = useState(savedInput?.size || DEFAULT_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

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
    const message = prompt.trim();
    if (isLoading || !message) return;
    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 三個 options 直接送當前值（初始就是 DEFAULT_*，等同於不覆寫；user 改過則送新值）。
      const response = await apiClient.post(
        ENDPOINT,
        { message, model, quality, size },
        { signal: controller.signal },
      );
      // 將 prompt、options 與唯一圖片 URL 追加至歷史；Context/sessionStorage 不再保存 Base64。
      appendSlot([
        { role: "user", prompt: message, model, quality, size },
        {
          role: "assistant",
          prompt: message,
          model,
          quality,
          size,
          imageUrl: toApiImageUrl(response.data.imageUrl),
        },
      ]);
    } catch (error) {
      const errorMessage = errorToText(error);
      if (errorMessage) {
        appendSlot([
          { role: "user", prompt: message, model, quality, size },
          { role: "error", prompt: message, content: errorMessage },
        ]);
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  // 比 ImagePage 多重置三個 options（回到 DEFAULT_* 的初始狀態）。
  function clearAll() {
    setPrompt("");
    setModel(DEFAULT_MODEL);
    setQuality(DEFAULT_QUALITY);
    setSize(DEFAULT_SIZE);
    writeSlot([]);
  }

  const hasResult = results.length > 0;
  // 「與預設狀態不同」才需要 Clear——prompt 有值 或 任一 option 被改過。
  const hasChanges =
    !!prompt ||
    model !== DEFAULT_MODEL ||
    quality !== DEFAULT_QUALITY ||
    size !== DEFAULT_SIZE;

  return (
    <article className="api-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>Generate Image with Options</h1>
          <p>透過下拉選單指定模型、品質與尺寸；未選則使用後端預設。</p>
        </div>
        <code>API 端口：{ENDPOINT}</code>
      </header>

      <section className="chat-panel">
        <div className="chat-toolbar">
          <div>
            <span className="status-dot" /> Ready
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={isLoading || (!hasResult && !hasChanges)}
          >
            Clear images 清除圖片紀錄
          </button>
        </div>

        <div className="messages" aria-live="polite">
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
              <p>選擇 options（可略）並輸入描述，按下 Generate 送出。</p>
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
                <p className="saved-path">
                  {result.model} · {result.quality} · {result.size}
                </p>
              </div>
            ) : (
              <div className="message error" key={`error-${index}`}>
                <strong>Error</strong>
                <pre>{result.content}</pre>
              </div>
            ),
          )}
          {isLoading && (
            <div className="message assistant typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {/* Options 下拉列：三個 select 讓使用者指定 model / quality / size。
              用 <label> 包 select 讓文字提示與控制項綁定，點文字也能聚焦下拉。
              等於 DEFAULT_* 的 option 會在右邊顯示 "(default)" 標記。 */}
          <div className="composer-options">
            <label>
              Model
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                disabled={isLoading}
              >
                {MODELS.map((value) => (
                  <option key={value} value={value}>
                    {optionLabel(value, DEFAULT_MODEL)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quality
              <select
                value={quality}
                onChange={(event) => setQuality(event.target.value)}
                disabled={isLoading}
              >
                {QUALITIES.map((value) => (
                  <option key={value} value={value}>
                    {optionLabel(value, DEFAULT_QUALITY)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Size
              <select
                value={size}
                onChange={(event) => setSize(event.target.value)}
                disabled={isLoading}
              >
                {SIZES.map((value) => (
                  <option key={value} value={value}>
                    {optionLabel(value, DEFAULT_SIZE)}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
          <small>選擇 options 後填描述，按 ↑ 送出</small>
        </form>
      </section>
    </article>
  );
}
