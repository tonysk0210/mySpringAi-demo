import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";

const ENDPOINT = "/image/image-options";

const MODELS = [
  "",
  "gpt-image-1",
  "gpt-image-1-mini",
  "gpt-image-1.5",
  "gpt-image-2",
  "chatgpt-image-latest",
  "dall-e-3",
];
const QUALITIES = ["", "auto", "low", "medium", "high"];
const SIZES = [
  "",
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "1792x1024",
  "1024x1792",
];

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

function optionLabel(value) {
  return value || "(default)";
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
  const [model, setModel] = useState(savedInput?.model || "");
  const [quality, setQuality] = useState(savedInput?.quality || "");
  const [size, setSize] = useState(savedInput?.size || "");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
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
    if (isLoading) return;
    if (!message) {
      setValidationError("請輸入圖片描述。");
      return;
    }

    setValidationError("");
    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await apiClient.post(
        ENDPOINT,
        {
          message,
          model: model || null,
          quality: quality || null,
          size: size || null,
        },
        { signal: controller.signal },
      );
      writeSlot([
        { role: "user", prompt: message, model, quality, size },
        {
          role: "assistant",
          b64Json: response.data.b64Json,
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

  function clearAll() {
    setPrompt("");
    setModel("");
    setQuality("");
    setSize("");
    setValidationError("");
    writeSlot([]);
  }

  const hasResult = !!latestResult;
  const hasAnyInput = !!(prompt || model || quality || size);

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
            disabled={isLoading || (!hasResult && !hasAnyInput)}
          >
            Clear 清除
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
                src={`data:image/png;base64,${latestResult.b64Json}`}
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
          {validationError && (
            <p className="validation-error">{validationError}</p>
          )}
          <div className="composer-options">
            <label>
              Model
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                disabled={isLoading}
              >
                {MODELS.map((value) => (
                  <option key={value || "default-model"} value={value}>
                    {optionLabel(value)}
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
                  <option key={value || "default-quality"} value={value}>
                    {optionLabel(value)}
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
                  <option key={value || "default-size"} value={value}>
                    {optionLabel(value)}
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
