import AudioTranscriptionDemo from "../components/AudioTranscriptionDemo";

export default function AudioTranscribeOptionsPage() {
  return <AudioTranscriptionDemo endpoint="/audio/transcribe-options" title="Audio Transcription Options" description="上傳音訊並控制提示、語言、temperature 與字幕格式。" withOptions />;
}
