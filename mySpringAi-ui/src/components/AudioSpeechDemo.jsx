import { useEffect, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";

/*
 * Blob 在這個元件中的用途（文字轉語音）：
 *
 * 1. Blob 可以想成瀏覽器收到的一包「原始音訊資料」。它不是網址，也不是電腦上的檔案路徑。
 * 2. 後端產生語音後，Axios 會把 response.data 當成 Blob，讓瀏覽器知道這是音訊資料而非一般文字。
 * 3. <audio> 和 <a> 需要 URL 才能使用這包資料，所以 URL.createObjectURL(blob) 會向瀏覽器取得
 *    一個 blob: 開頭的臨時 URL。這個 URL 像取件號碼，瀏覽器會用它找到背後的音訊 Blob。
 * 4. 播放、暫停、重播及下載都需要這個 URL，因此不能建立後立刻撤銷；audioUrl state 負責把它交給畫面，
 *    audioUrlRef 則記住最新 URL，讓程式知道之後該撤銷哪一個。
 * 5. 產生新音訊、按 Clear 或離開頁面時，舊 URL 已不再使用，便以 URL.revokeObjectURL() 撤銷，
 *    讓瀏覽器可在沒有其他引用後回收音訊資源，避免多次產生語音造成資源持續累積。
 */

// 後端支援的語音角色與音訊輸出格式。
const VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "ballad",
  "sage",
  "coral",
  "verse",
  "ash",
];
const FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"];

// 將 Axios 的取消、HTTP、網路與一般錯誤轉成可顯示的使用者訊息。
// 因為成功與錯誤 response 都可能以 Blob 回傳，所以需先讀出錯誤 Blob 的內容。
async function errorToText(error) {
  if (axios.isCancel(error)) return null;
  if (error.response) {
    let detail = error.response.data;
    if (detail instanceof Blob) {
      const text = await detail.text();
      try {
        detail = JSON.parse(text);
      } catch {
        detail = text;
      }
    }
    const formatted =
      typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    return `HTTP ${error.response.status}${formatted ? `\n${formatted}` : ""}`;
  }
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";
  return error.message || "產生語音時發生錯誤。";
}

export default function AudioSpeechDemo({
  endpoint,
  title,
  description,
  withOptions = false,
}) {
  // 要轉換的文字與進階語音選項。
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState("1");
  const [responseFormat, setResponseFormat] = useState("mp3");

  // audioUrl（畫面用）：保存「指向音訊 Blob 的臨時 URL 字串」，不是音訊資料本身。
  // JSX 會把它設為 <audio src> 與下載連結的 href；setAudioUrl() 會觸發重新渲染，
  // 讓新播放器出現、切換音訊，或在值變成空字串時從畫面移除播放器。
  const [audioUrl, setAudioUrl] = useState("");

  // 產生後的下載名稱、錯誤與 loading 狀態。
  const [downloadName, setDownloadName] = useState("speech.mp3");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 保存目前請求，供元件卸載時取消尚未完成的 API 呼叫。
  const controllerRef = useRef(null);

  // audioUrlRef（資源清理用）：保存與 audioUrl 相同的最新 Blob URL 字串，
  // 但修改 current 不會觸發重新渲染。它讓非畫面流程隨時取得目前 URL，
  // 以便在新音訊取代、按下 Clear 或元件卸載時呼叫 revokeObjectURL()；
  // 撤銷後瀏覽器便可在資源不再被引用時回收背後的音訊 Blob。
  const audioUrlRef = useRef("");

  // 此 Blob URL 需持續提供給 audio 播放，不能建立後立即撤銷；
  // 與轉錄檔的一次性下載不同，應在新音訊取代、Clear 或元件卸載時才釋放。
  function replaceAudioUrl(nextUrl = "") {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
  }

  // 離開頁面時取消未完成的請求，並釋放目前音訊的 Blob URL。
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  // 驗證輸入後，呼叫文字轉語音 API 並將回傳 Blob 建立成可播放、下載的 URL。
  async function handleSubmit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text) {
      setValidationError("請輸入要轉成語音的文字。");
      return;
    }
    setValidationError("");
    replaceAudioUrl();
    setError("");
    setIsLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    // 未啟用進階選項的 endpoint 固定回傳 mp3。
    const format = withOptions ? responseFormat : "mp3";

    try {
      // 依 endpoint 類型組裝基本或包含 voice、speed、format 的 request body。
      const payload = withOptions
        ? { message: text, voice, speed: Number(speed), responseFormat: format }
        : { message: text };
      const response = await apiClient.post(endpoint, payload, {
        // 音訊是二進位資料，需指定 Blob，並讓 AbortController 可取消請求。
        responseType: "blob",
        signal: controller.signal,
      });

      // 內層先為音訊 Blob 建立臨時 URL；外層再釋放舊 URL，並讓畫面改用新 URL。
      replaceAudioUrl(URL.createObjectURL(response.data));
      setDownloadName(`speech.${format}`);
    } catch (requestError) {
      const detail = await errorToText(requestError);
      if (detail) setError(detail);
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  }

  // 清除畫面結果時也會撤銷 Blob URL，立即釋放音訊資源。
  function clearResult() {
    replaceAudioUrl();
    setError("");
  }

  return (
    <article className="api-page">
      {/* 頁面標題與後端 endpoint。 */}
      <header className="page-header">
        <div>
          <p className="eyebrow">OpenAI Audio</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <code>{endpoint}</code>
      </header>
      <section className="chat-shell audio-shell">
        {/* 工具列：顯示功能名稱，並在有結果或錯誤時開放清除。 */}
        <div className="chat-toolbar">
          <span>Text to speech</span>
          <button
            type="button"
            disabled={!audioUrl && !error}
            onClick={clearResult}
          >
            Clear
          </button>
        </div>

        {/* 顯示空狀態、loading、音訊播放器或錯誤。 */}
        <div className="messages audio-result-area">
          {!audioUrl && !error && !isLoading && (
            <div className="empty-state">輸入文字並產生可直接播放的音訊。</div>
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
              <h2>語音生成中…</h2>
              <p>處理時間會依文字長度而有所不同，請稍候。</p>
            </div>
          )}
          {audioUrl && (
            <div className="message assistant audio-player-card">
              <strong>Generated speech</strong>

              {/* 瀏覽器原生音訊播放器：controls 顯示播放、進度與音量控制；
                  src 使用剛建立的 Blob URL 讀取音訊。元素內文字只會在瀏覽器
                  完全不支援 HTML audio 元素時顯示。 */}
              <audio controls src={audioUrl}>
                你的瀏覽器不支援 audio 元素。
              </audio>

              {/* 下載連結與播放器共用同一個 Blob URL，download 指定下載時的檔名。 */}
              <a
                className="audio-download"
                href={audioUrl}
                download={downloadName}
              >
                Download {downloadName}
              </a>
            </div>
          )}
          {error && (
            <div className="message error">
              <strong>Error</strong>
              <pre>{error}</pre>
            </div>
          )}
        </div>

        {/* 文字輸入、進階語音選項與送出區。 */}
        <form className="composer audio-composer" onSubmit={handleSubmit}>
          {validationError && (
            <p className="validation-error">{validationError}</p>
          )}
          {withOptions && (
            <div className="composer-options">
              <label>
                Voice
                <select
                  value={voice}
                  onChange={(event) => setVoice(event.target.value)}
                >
                  {VOICES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Speed
                <input
                  type="number"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={speed}
                  onChange={(event) => setSpeed(event.target.value)}
                />
              </label>
              <label>
                Format
                <select
                  value={responseFormat}
                  onChange={(event) => setResponseFormat(event.target.value)}
                >
                  {FORMATS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="audio-input-row">
            <textarea
              rows="3"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setValidationError("");
              }}
              placeholder="輸入要轉成語音的文字…"
            />
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Generate speech"
            >
              ↑
            </button>
          </div>
          <small>音訊直接回傳瀏覽器，不會保存在後端；離開頁面後即釋放。</small>
        </form>
      </section>
    </article>
  );
}
