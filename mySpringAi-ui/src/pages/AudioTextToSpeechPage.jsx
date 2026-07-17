import AudioSpeechDemo from "../components/AudioSpeechDemo";

export default function AudioTextToSpeechPage() {
  return <AudioSpeechDemo endpoint="/audio/text-to-speech" title="基礎文字轉語音" description="使用 gpt-4o-mini-tts 預設聲音將文字轉成可播放及下載的 MP3。" />;
}
