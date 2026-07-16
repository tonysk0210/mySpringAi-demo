import AudioSpeechDemo from "../components/AudioSpeechDemo";

export default function AudioTextToSpeechPage() {
  return <AudioSpeechDemo endpoint="/audio/text-to-speech" title="Text to Speech" description="輸入文字，使用預設聲音產生可直接播放及下載的 MP3。" />;
}
