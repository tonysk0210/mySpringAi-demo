import { useEffect, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ballad", "sage", "coral", "verse", "ash"];
const FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"];

async function errorToText(error) {
  if (axios.isCancel(error)) return null;
  if (error.response) {
    let detail = error.response.data;
    if (detail instanceof Blob) {
      const text = await detail.text();
      try { detail = JSON.parse(text); } catch { detail = text; }
    }
    const formatted = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    return `HTTP ${error.response.status}${formatted ? `\n${formatted}` : ""}`;
  }
  if (error.request) return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";
  return error.message || "產生語音時發生錯誤。";
}

export default function AudioSpeechDemo({ endpoint, title, description, withOptions = false }) {
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState("1");
  const [responseFormat, setResponseFormat] = useState("mp3");
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadName, setDownloadName] = useState("speech.mp3");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef(null);
  const audioUrlRef = useRef("");

  function replaceAudioUrl(nextUrl = "") {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
  }

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text) {
      setValidationError("請輸入要轉成語音的文字。");
      return;
    }
    setValidationError("");
    setError("");
    setIsLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    const format = withOptions ? responseFormat : "mp3";

    try {
      const payload = withOptions
        ? { message: text, voice, speed: Number(speed), responseFormat: format }
        : { message: text };
      const response = await apiClient.post(endpoint, payload, {
        responseType: "blob",
        signal: controller.signal,
      });
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

  function clearResult() {
    replaceAudioUrl();
    setError("");
  }

  return (
    <article className="api-page">
      <header className="page-header">
        <div><p className="eyebrow">OpenAI Audio</p><h1>{title}</h1><p>{description}</p></div>
        <code>{endpoint}</code>
      </header>
      <section className="chat-shell audio-shell">
        <div className="chat-toolbar"><span>Text to speech</span><button type="button" disabled={!audioUrl && !error} onClick={clearResult}>Clear</button></div>
        <div className="messages audio-result-area">
          {!audioUrl && !error && !isLoading && <div className="empty-state">輸入文字並產生可直接播放的音訊。</div>}
          {isLoading && <div className="loading-dots"><span /><span /><span /></div>}
          {audioUrl && (
            <div className="message assistant audio-player-card">
              <strong>Generated speech</strong>
              <audio controls src={audioUrl}>你的瀏覽器不支援 audio 元素。</audio>
              <a className="audio-download" href={audioUrl} download={downloadName}>Download {downloadName}</a>
            </div>
          )}
          {error && <div className="message error"><strong>Error</strong><pre>{error}</pre></div>}
        </div>
        <form className="composer audio-composer" onSubmit={handleSubmit}>
          {validationError && <p className="validation-error">{validationError}</p>}
          {withOptions && (
            <div className="composer-options">
              <label>Voice<select value={voice} onChange={(event) => setVoice(event.target.value)}>{VOICES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Speed<input type="number" min="0.25" max="4" step="0.25" value={speed} onChange={(event) => setSpeed(event.target.value)} /></label>
              <label>Format<select value={responseFormat} onChange={(event) => setResponseFormat(event.target.value)}>{FORMATS.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          )}
          <div className="audio-input-row">
            <textarea rows="3" value={message} onChange={(event) => { setMessage(event.target.value); setValidationError(""); }} placeholder="輸入要轉成語音的文字…" />
            <button type="submit" disabled={isLoading} aria-label="Generate speech">↑</button>
          </div>
          <small>音訊直接回傳瀏覽器，不會保存在後端；離開頁面後即釋放。</small>
        </form>
      </section>
    </article>
  );
}
