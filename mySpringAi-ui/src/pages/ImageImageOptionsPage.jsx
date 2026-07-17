import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";

const ENDPOINT = "/image/image-options";

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
  "chatgpt-image-latest",
  "dall-e-3",
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
  const savedInput = slot.find((m) => m.role === "user");
  const latestResult = slot.find(
    (m) => m.role === "assistant" || m.role === "error",
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
      // slot 的 user 物件多存三個 options 欄位；下次進頁面能一併回填下拉選單。
      writeSlot([
        { role: "user", prompt: message, model, quality, size },
        {
          role: "assistant",
          imageBase64: response.data.imageBase64,
          savedPath: response.data.savedPath,
        },
      ]);
    } catch (error) {
      const errorMessage = errorToText(error);
      if (errorMessage) {
        writeSlot([
          { role: "user", prompt: message, model, quality, size },
          { role: "error", content: errorMessage },
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

  const hasResult = !!latestResult;
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
        <code>{ENDPOINT}</code>
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
            Clear image 清除暫存圖片
          </button>
        </div>

        <div className="messages" aria-live="polite">
          {!hasResult && !isLoading && (
            <div className="empty-chat">
              <span>✦</span>
              <h2>準備生成圖片</h2>
              <p>選擇 options（可略）並輸入描述，按下 Generate 送出。</p>
            </div>
          )}
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
          {hasResult && latestResult.role === "error" && (
            <div className="message error">
              <strong>Error</strong>
              <pre>{latestResult.content}</pre>
            </div>
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
