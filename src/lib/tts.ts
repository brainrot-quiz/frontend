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

  
  // 입력이 characterVoiceMap의 키와 일치하는지 확인 (캐릭터 ID인지 확인)
  const isCharacterId = Object.keys(characterVoiceMap).includes(text);

  
  let characterText = text;
  let voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam

  // 캐릭터 ID가 제공된 경우 관련 텍스트와 음성 ID 가져오기
  if (isCharacterId) {
    const character = characterVoiceMap[text];
    characterText = character.text;
    voiceId = character.voiceId;
    
  } else {

  }

  // API 요청을 위한 최대 재시도 횟수
  const maxRetries = 2;
  let currentRetry = 0;
  let success = false;
  let audioUrl = "";

  while (currentRetry <= maxRetries && !success) {
    if (currentRetry > 0) {

      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      
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

        currentRetry++;
        continue;
      }

      const audioBlob = await response.blob();
      audioUrl = URL.createObjectURL(audioBlob);

      success = true;
    } catch (error) {

      currentRetry++;
    }
  }

  if (!success) {

    return "";
  }

  return audioUrl;
} 