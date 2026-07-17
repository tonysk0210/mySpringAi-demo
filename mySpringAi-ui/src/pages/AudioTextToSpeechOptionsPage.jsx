import AudioSpeechDemo from "../components/AudioSpeechDemo";

export default function AudioTextToSpeechOptionsPage() {
  return <AudioSpeechDemo endpoint="/audio/text-to-speech-options" title="進階文字轉語音 Options" description="指定 voice、speed 與輸出格式，產生可播放及下載的語音。" withOptions />;
}
