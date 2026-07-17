import AudioTranscriptionDemo from "../components/AudioTranscriptionDemo";

export default function AudioTranscribePage() {
  return <AudioTranscriptionDemo endpoint="/audio/transcribe" title="基礎音訊轉文字" description="上傳音訊檔，使用 whisper-1 預設設定轉錄為純文字。" />;
}
