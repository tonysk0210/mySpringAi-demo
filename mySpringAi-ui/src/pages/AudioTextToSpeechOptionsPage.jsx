import AudioSpeechDemo from "../components/AudioSpeechDemo";

export default function AudioTextToSpeechOptionsPage() {
  return <AudioSpeechDemo endpoint="/audio/text-to-speech-options" title="Text to Speech Options" description="選擇聲音、語速及格式後產生語音。" withOptions />;
}
