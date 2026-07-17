import { useEffect, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import SubmitButton from "./SubmitButton";

/*
 * Blob 在這個元件中的用途（音訊轉文字）：
 *
 * 1. 使用者選取的音訊是 File；File 是帶有檔名等資訊的 Blob，可直接放入 FormData 上傳給後端。
 * 2. 有進階選項時，程式另建一個 application/json Blob，把 prompt、language 等 JSON 資料當成
 *    multipart 的 options 區塊送出。以上兩種 Blob 都未建立 Blob URL，請求結束且不再被引用後，
 *    瀏覽器會自行處理資源，不需要呼叫 URL.revokeObjectURL()。
 * 3. 後端回傳的是轉錄結果文字；只有使用者按 Download 時，才把文字包成可下載的文字 Blob。
 * 4. 下載連結需要 URL，所以程式臨時以 URL.createObjectURL(blob) 建立 blob: URL，像替這份文字檔
 *    取得一次性的取件號碼，再透過隱藏的 <a> 觸發瀏覽器下載。
 * 5. 這個 URL 不需要像語音播放器一樣留著重播；下載啟動後便立即以 URL.revokeObjectURL() 撤銷，
 *    所以不需要使用 state 或 ref 保存，也不用等到 Clear 或元件卸載才清理。
 */

// 後端目前允許的轉錄輸出格式。
const TRANSCRIPTION_FORMATS = ["text", "srt", "vtt"];

// 將 API response 統一轉成可顯示文字。
function responseToText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// 將 Axios 的取消、HTTP、網路與一般錯誤轉成使用者訊息。
function errorToText(error) {
  if (axios.isCancel(error)) return null;
  if (error.response) {
    const detail = responseToText(error.response.data);
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ""}`;
  }
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";
  return error.message || "轉錄音訊時發生錯誤。";
}

export default function AudioTranscriptionDemo({
  endpoint,
  title,
  description,
  withOptions = false,
}) {
  // 上傳檔案與進階轉錄選項。
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("");
  const [temperature, setTemperature] = useState("0");
  const [responseFormat, setResponseFormat] = useState("text");

  // 請求結果、錯誤與 loading 狀態。
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef(null);

  // 離開頁面時取消未完成的轉錄請求。
  useEffect(() => () => controllerRef.current?.abort(), []);

  // 驗證檔案後，以 multipart/form-data 送出音訊與可選 options。
  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setValidationError("請選擇音訊檔案。");
      return;
    }
    setValidationError("");
    setResult(null);
    setError("");
    setIsLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    // FormData：組裝 multipart request，file 與 options 分別對應後端的 @RequestPart。
    const formData = new FormData();
    formData.append("file", file);
    if (withOptions) {
      formData.append(
        "options",
        // Blob：將 options JSON 包成帶 application/json 型態的檔案型資料；
        // 此處未建立 Blob URL，請求結束後由瀏覽器回收，不需呼叫 revokeObjectURL。
        new Blob(
          [
            JSON.stringify({
              prompt: prompt.trim(),
              language: language.trim(),
              temperature: Number(temperature),
              responseFormat,
            }),
          ],
          { type: "application/json" },
        ),
      );
    }

    // Axios／瀏覽器會自動設定 multipart Content-Type 與 boundary。
    try {
      const response = await apiClient.post(endpoint, formData, {
        signal: controller.signal,
      });
      setResult(response.data);
    } catch (requestError) {
      const message = errorToText(requestError);
      if (message) setError(message);
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  }

  // 在瀏覽器記憶體中將轉錄文字組成檔案，觸發下載；後端無須建立實體檔案。
  function downloadResult() {
    // 1. 尚無轉錄結果時不執行下載。
    if (!result) return;

    // 2. 將轉錄文字包裝成 UTF-8 純文字 Blob（記憶體中的檔案型資料）。
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });

    // 3. 此 Blob URL 只用來觸發一次下載，不需像語音播放器跨 render 保留；
    // 因此下載啟動後即可立即撤銷，不必使用 state 或 ref 保存。
    const url = URL.createObjectURL(blob);

    // 4. 建立暫時下載連結，指定下載來源與 text／srt／vtt 副檔名。
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcription.${result.format}`;

    // 5. 模擬點擊連結，讓瀏覽器開始下載。
    link.click();

    // 6. 下載啟動後撤銷暫時 URL，避免 Blob 持續佔用記憶體。
    URL.revokeObjectURL(url);
  }

  return (
    <article className="api-page">
      {/* 頁面標題與後端 endpoint。 */}
      <header className="page-header">
        <div>
          <p className="eyebrow">OPENAI AUDIO</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <code>API 端口：{endpoint}</code>
      </header>

      <section className="chat-shell audio-shell">
        {/* 工具列：顯示功能名稱與清除結果。 */}
        <div className="chat-toolbar">
          <span>Audio transcription</span>
          <button
            type="button"
            disabled={!result && !error}
            onClick={() => {
              setResult(null);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {/* 顯示空狀態、loading、轉錄結果或錯誤。 */}
        <div className="messages audio-result-area">
          {!result && !error && !isLoading && (
            <div className="empty-state">
              選擇音訊檔案後送出，即可在這裡查看轉錄結果。
            </div>
          )}
          {isLoading && (
            <div
              className="empty-chat transcription-loading"
              role="status"
              aria-live="polite"
            >
              <div className="typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h2>音訊轉錄中…</h2>
              <p>處理時間會依音訊長度而有所不同，請稍候。</p>
            </div>
          )}
          {result && (
            <div className="message assistant">
              <strong>Transcription · {result.format}</strong>
              <pre>{result.text}</pre>
              <div className="audio-result-actions">
                <span>{result.sourceFileName}</span>
                <button type="button" onClick={downloadResult}>
                  Download .{result.format}
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="message error">
              <strong>Error</strong>
              <pre>{error}</pre>
            </div>
          )}
        </div>

        {/* 轉錄設定、檔案選擇與送出區。 */}
        <form className="composer audio-composer" onSubmit={handleSubmit}>
          {validationError && (
            <p className="validation-error">{validationError}</p>
          )}
          {withOptions && (
            <div className="composer-options">
              <label>
                Prompt
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Talking about Spring AI"
                />
              </label>
              <label>
                Language
                <input
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="auto / en / zh"
                  maxLength={2}
                />
              </label>
              <label>
                Temperature
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                />
              </label>
              <label>
                Format
                <select
                  value={responseFormat}
                  onChange={(event) => setResponseFormat(event.target.value)}
                >
                  {TRANSCRIPTION_FORMATS.map((format) => (
                    <option key={format}>{format}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="audio-input-row">
            <label className="file-picker">
              <span>{file ? file.name : "Choose audio file"}</span>
              <input
                type="file"
                accept="audio/*,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setValidationError("");
                }}
              />
            </label>
            <SubmitButton
              isLoading={isLoading}
              disabled={isLoading}
              label="開始轉錄音訊"
            />
          </div>
          <small>檔案上限 25 MB；來源音檔不會保存在後端。</small>
        </form>
      </section>
    </article>
  );
}
