'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon } from '@heroicons/react/24/solid';
import { characters as importedCharacters } from '@/data/characters';
import Image from 'next/image';
import { getFirebaseInstance } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// 전역 변수로 오디오 객체 선언
let currentAudio: HTMLAudioElement | null = null;

// 오디오 재생 함수
const playCharacterSound = (characterName: string) => {
  try {
    // 이미 재생 중인 오디오가 있으면 중지
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;
    
    // 캐릭터 이름에 따른 오디오 파일 이름 매핑
    const nameToFilenameMap: Record<string, string> = {
      'Tripi Tropi': 'Trippi Troppi',
      'Burbaloni Luliloli': 'Burbaloni Lulilolli',
      'Bobritto Bandito': 'Bobrito bandito',
      'Giraffa Celeste': 'Girafa Celestre',
      'Frigo Camello': 'Frigo Camelo',
      'Frulli Frulla': 'Fruli Frula',
      'Tracotocutulo Lirilì Larilà': 'Lirilì Larilà',
      
      // 추가 매핑
      'Trulimero Trulicina': 'Trulimero Trulicina',
      'Troppa Trippa': 'Troppa Trippa',
      'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina': 'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina',
      'Tralalero Tralala': 'Tralalero Tralala',
      'Talpa Di Ferro': 'Talpa Di Ferro',
      'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur': 'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur',
      'Svinino Bombondino': 'Svinino Bombondino',
      'Pot hotspot': 'Pot hotspot',
      'La Vaca Saturno Saturnita': 'La Vaca Saturno Saturnita',
      'Il Cacto Hipopotamo': 'Il Cacto Hipopotamo',
      'Glorbo Fruttodrillo': 'Glorbo Fruttodrillo',
      'Garamaraman dan Madudungdung tak tuntung perkuntung': 'Garamaraman dan Madudungdung tak tuntung perkuntung',
      'Chimpanzini Bananini': 'Chimpanzini Bananini',
      'Chef Crabracadabra': 'Chef Crabracadabra',
      'Cappuccino Assassino': 'Cappuccino Assassino',
      'Brr Brr Patapim': 'Brr Brr Patapim',
      'Brii Brii Bicus Dicus Bombicus': 'Brii Brii Bicus Dicus Bombicus',
      'Boneca Ambalabu': 'Boneca Ambalabu',
      'Bombombini Gusini': 'Bombombini Gusini',
      'Bombardiro Crocodilo': 'Bombardiro Crocodilo',
      'Bombardiere Lucertola': 'Bombardiere Lucertola',
      'Blueberrinni Octopussini': 'Blueberrinni Octopussini',
      'Ballerina Cappuccina': 'Ballerina Cappuccina',
      'U Din Din Din Din Dun Ma Din Din Din Dun': 'U Din Din Din Din Dun Ma Din Din Din Dun',
      'Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur': 'Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur'
    };
    
    // 매핑된 파일 이름이 있으면 사용, 없으면 원래 캐릭터 이름 사용
    const audioFileName = nameToFilenameMap[characterName] || characterName;
    
    // 오디오 파일 경로 설정
    const audioPath = `/sounds/${audioFileName}.mp3`;
    console.log("오디오 파일 재생 시도:", audioPath);
    
    // 오디오 객체 생성 및 재생
    const audio = new Audio(audioPath);
    
    // 전역 참조 저장
    currentAudio = audio;
    
    // 오디오 로드 이벤트 핸들러
    audio.onloadeddata = () => {
      console.log("오디오 파일 로드 성공:", audioPath);
    };
    
    // 오디오 재생 완료 이벤트 핸들러 추가
    audio.onended = () => {
      console.log("오디오 재생 완료");
      if (currentAudio === audio) {
        currentAudio = null;
      }
    };
    
    // 오류 이벤트 핸들러 추가
    audio.onerror = (e) => {
      console.error("오디오 재생 오류:", e, "파일:", audioPath);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      
      // 폴백: 다른 형식으로 파일명 시도
      tryFallbackAudio(characterName);
    };
    
    audio.play().catch(error => {
      console.error("오디오 재생 시작 오류:", error);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      
      // 폴백: 다른 형식으로 파일명 시도
      tryFallbackAudio(characterName);
    });
  } catch (error) {
    console.error('오디오 재생 오류:', error);
    currentAudio = null;
    // 사용자에게 오류 표시
    alert(`"${characterName}" 캐릭터의 음성을 재생할 수 없습니다.`);
  }
};

// 대체 파일 이름으로 재시도하는 폴백 함수
const tryFallbackAudio = (characterName: string) => {
  try {
    // 공백 제거 버전 시도
    const noSpaceName = characterName.replace(/\s+/g, '');
    const fallbackPath = `/sounds/${noSpaceName}.mp3`;
    console.log("폴백 오디오 파일 시도:", fallbackPath);
    
    const fallbackAudio = new Audio(fallbackPath);
    currentAudio = fallbackAudio;
    
    fallbackAudio.onended = () => {
      console.log("폴백 오디오 재생 완료");
      if (currentAudio === fallbackAudio) {
        currentAudio = null;
      }
    };
    
    fallbackAudio.onerror = () => {
      console.error("폴백 오디오 재생 실패:", fallbackPath);
      if (currentAudio === fallbackAudio) {
        currentAudio = null;
      }
      
      // 모든 시도 실패 시 사용자에게 알림
      console.warn(`"${characterName}" 캐릭터의 오디오를 재생할 수 없습니다.`);
      alert(`"${characterName}" 캐릭터의 음성을 재생할 수 없습니다.`);
    };
    
    fallbackAudio.play().catch(error => {
      console.error("폴백 오디오 재생 시작 오류:", error);
      if (currentAudio === fallbackAudio) {
        currentAudio = null;
      }
    });
  } catch (error) {
    console.error('폴백 오디오 재생 오류:', error);
    currentAudio = null;
  }
};

interface CharacterWithLikes {
  id: string;
  name: string;
  description: string;
  image: string;
  likes: number;
}

export default function Characters() {
  const [characters, setCharacters] = useState<CharacterWithLikes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 좋아요 데이터 로드
  useEffect(() => {
    async function loadLikesData() {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Firebase 인스턴스 가져오기
        const { db } = await getFirebaseInstance();
        
        // Firebase에서 좋아요 데이터 불러오기
        const likesDocRef = doc(db, 'statistics', 'character_likes');
        const likesDocSnap = await getDoc(likesDocRef);
        
        let firebaseLikes: Record<string, number> = {};
        if (likesDocSnap.exists()) {
          firebaseLikes = likesDocSnap.data() as Record<string, number> || {};
          console.log('Firebase 좋아요 데이터 로드 성공:', firebaseLikes);
        } else {
          console.log('Firebase에 좋아요 데이터가 없어 새로 생성합니다.');
          await setDoc(likesDocRef, {});
        }
        
        // 로컬 스토리지 데이터도 함께 불러와 병합
        let localLikes: Record<string, number> = {};
        try {
          const likesData = localStorage.getItem('character_likes') || '{}';
          localLikes = JSON.parse(likesData);
          console.log('로컬 좋아요 데이터 로드 성공:', localLikes);
        } catch (localError) {
          console.error('로컬 좋아요 데이터 로드 오류:', localError);
        }
        
        // Firebase와 로컬 데이터 병합 (Firebase 우선)
        const mergedLikes = { ...localLikes, ...firebaseLikes };
        
        // 로컬 스토리지 업데이트
        localStorage.setItem('character_likes', JSON.stringify(mergedLikes));
        
        // 데이터 처리
        const processedCharacters = importedCharacters.map(char => ({
          id: char.id,
          name: char.name,
          description: char.description || '',
          image: `/characters/${char.image}`,
          likes: mergedLikes[char.id] || 0
        }));
        
        // 좋아요 순으로 정렬
        const sortedCharacters = processedCharacters.sort((a, b) => b.likes - a.likes);
        setCharacters(sortedCharacters);
      } catch (error) {
        console.error('캐릭터 데이터 처리 중 오류:', error);
        setLoadError('데이터를 불러오는 중 오류가 발생했습니다.');
        
        // 오류 발생 시 기본 데이터 사용
        const defaultCharacters = importedCharacters.map(char => ({
          id: char.id,
          name: char.name,
          description: char.description || '',
          image: `/characters/${char.image}`,
          likes: 0
        }));
        setCharacters(defaultCharacters);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadLikesData();
  }, []);
  
  // 좋아요 처리 함수
  const handleLike = async (characterId: string) => {
    try {
      // 캐릭터 ID 유효성 확인
      if (!characterId) {
        console.error('유효하지 않은 캐릭터 ID:', characterId);
        return;
      }
      
      // 좋아요 증가 애니메이션을 바로 보여주기 위해 선제적으로 UI 업데이트
      setCharacters(prevCharacters => {
        const updatedCharacters = prevCharacters.map(char => 
          char.id === characterId 
            ? { ...char, likes: char.likes + 1 } 
            : char
        );
        return updatedCharacters.sort((a, b) => b.likes - a.likes);
      });
      
      // Firebase 인스턴스 가져오기
      const { db } = await getFirebaseInstance();
      
      // 1. Firebase 업데이트
      const likesDocRef = doc(db, 'statistics', 'character_likes');
      await updateDoc(likesDocRef, {
        [characterId]: increment(1)
      }).catch(async (error) => {
        // 문서가 없으면 생성
        if (error.code === 'not-found') {
          await setDoc(likesDocRef, { [characterId]: 1 });
        } else {
          throw error;
        }
      });
      console.log(`Firebase에 ${characterId} 좋아요 카운트 증가 성공`);
      
      // 2. 현재 로컬 스토리지 좋아요 데이터 업데이트
      try {
        const likesData = localStorage.getItem('character_likes') || '{}';
        const likes = JSON.parse(likesData);
        
        // 해당 캐릭터 좋아요 증가
        likes[characterId] = (likes[characterId] || 0) + 1;
        
        // 로컬 스토리지에 저장
        localStorage.setItem('character_likes', JSON.stringify(likes));
        console.log(`로컬 스토리지에 ${characterId} 좋아요 카운트 증가 성공`);
      } catch (localError) {
        console.error('로컬 스토리지 좋아요 처리 중 오류:', localError);
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
      
      // 실패 시 UI 롤백
      setCharacters(prevCharacters => {
        const updatedCharacters = prevCharacters.map(char => 
          char.id === characterId 
            ? { ...char, likes: Math.max(0, char.likes - 1) } 
            : char
        );
        return updatedCharacters.sort((a, b) => b.likes - a.likes);
      });
      
      // 사용자에게 오류 알림
      alert('좋아요 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 캐릭터 클릭 핸들러
  const handleCharacterClick = (character: CharacterWithLikes) => {
    playCharacterSound(character.name);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-blue-50 to-indigo-100">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-indigo-800">캐릭터 도감</h1>
      <p className="text-center text-gray-600 mb-8">Italian Brainrot의 모든 캐릭터를 만나보세요!</p>
      
      {loadError && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {loadError}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.05 }
              }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
              onClick={() => handleCharacterClick(character)}
            >
              <div className="h-48 overflow-hidden">
                <Image
                  src={character.image}
                  alt={character.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2 text-indigo-800">{character.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{character.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-indigo-600 font-medium">{character.likes}</span>
                    <span className="text-gray-500 ml-1">likes</span>
                  </div>
                  
                  <motion.button
                    onClick={() => handleLike(character.id)}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    <HeartIcon className="h-5 w-5 mr-1" />
                    <span>좋아요</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
} 