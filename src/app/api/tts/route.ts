import { NextResponse } from 'next/server';
import { textToSpeech } from '@/utils/tts';

export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(text, voice);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API 오류:', error);
    return NextResponse.json(
      { error: 'TTS 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 