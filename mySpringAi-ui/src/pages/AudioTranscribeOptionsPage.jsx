import AudioTranscriptionDemo from "../components/AudioTranscriptionDemo";

export default function AudioTranscribeOptionsPage() {
  return <AudioTranscriptionDemo endpoint="/audio/transcribe-options" title="進階音訊轉文字 Options" description="上傳音訊並指定 Prompt、語言、temperature 與 text、SRT 或 VTT 輸出格式。" withOptions />;
}
