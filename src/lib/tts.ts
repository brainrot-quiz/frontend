// 캐릭터 ID와 이름 일치를 위한 매핑
const characterVoiceMap: Record<string, { text: string; voiceId: string }> = {
  // 주요 캐릭터들의 발음 매핑
  'tralalero': { 
    text: 'Tralalero Tralala', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'bombombini': { 
    text: 'Bombombini Gusini', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'burbaloni': { 
    text: 'Burbaloni Luliloli', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'kaktus': { 
    text: 'Kaktus Tus Tus Kutus Kutus', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'bobrini': { 
    text: 'Bobrini Cocosini', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'cappuccino': { 
    text: 'Cappuccino Assassino', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'giraffa': { 
    text: 'Giraffa Celeste', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'ambatron': { 
    text: 'Ambatron', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'glorbo': { 
    text: 'Glorbo Fruttodrillo', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  'frulli': { 
    text: 'Frulli Frulla', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  // 기본값
  'default': { 
    text: '', 
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  }
};

/**
 * 텍스트를 음성으로 변환하는 함수
 * @param text 텍스트 또는 캐릭터 ID
 * @returns 오디오 URL
 */
export async function textToSpeech(text: string): Promise<string> {
  console.log('[TTS 디버깅] TTS 함수 호출됨, 입력:', text);
  
  // 입력이 characterVoiceMap의 키와 일치하는지 확인 (캐릭터 ID인지 확인)
  const isCharacterId = Object.keys(characterVoiceMap).includes(text);
  console.log('[TTS 디버깅] 캐릭터 ID 여부:', isCharacterId);
  
  let characterText = text;
  let voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam

  // 캐릭터 ID가 제공된 경우 관련 텍스트와 음성 ID 가져오기
  if (isCharacterId) {
    const character = characterVoiceMap[text];
    characterText = character.text;
    voiceId = character.voiceId;
    console.log('[TTS 디버깅] 캐릭터 ID 매핑 결과:', { 
      id: text, 
      text: characterText, 
      voiceId 
    });
  } else {
    console.log('[TTS 디버깅] 캐릭터 ID 아님, 직접 텍스트 사용:', text);
  }

  // API 요청을 위한 최대 재시도 횟수
  const maxRetries = 2;
  let currentRetry = 0;
  let success = false;
  let audioUrl = "";

  while (currentRetry <= maxRetries && !success) {
    if (currentRetry > 0) {
      console.log(`[TTS 디버깅] 재시도 ${currentRetry}/${maxRetries}`);
      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      console.log(`[TTS 디버깅] TTS 요청 준비: 텍스트="${characterText}", 음성 ID=${voiceId}`);
      
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: characterText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS 디버깅] API 응답 오류(시도 ${currentRetry + 1}/${maxRetries + 1}):`, response.status, errorText);
        currentRetry++;
        continue;
      }

      const audioBlob = await response.blob();
      audioUrl = URL.createObjectURL(audioBlob);
      console.log('[TTS 디버깅] TTS 요청 성공, URL 생성됨:', audioUrl);
      success = true;
    } catch (error) {
      console.error(`[TTS 디버깅] API 요청 예외 발생(시도 ${currentRetry + 1}/${maxRetries + 1}):`, error);
      currentRetry++;
    }
  }

  if (!success) {
    console.error('[TTS 디버깅] 모든 재시도 실패, 빈 문자열 반환');
    return "";
  }

  return audioUrl;
} 