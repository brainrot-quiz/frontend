import { SpeechSynthesizer, SpeechConfig, AudioConfig, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechConfig = SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY || '',
  process.env.AZURE_SPEECH_REGION || ''
);

export async function textToSpeech(text: string): Promise<string> {
  try {
    console.log('TTS 요청 시작:', { 
      text, 
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? '설정됨' : '설정안됨' 
    });
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => '응답 본문을 읽을 수 없음');
      console.error('TTS API 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`TTS API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('TTS 요청 처리 중 오류 발생:', error);
    throw error;
  }
} 