'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { textToSpeech } from '@/lib/tts';
import { FaStar, FaHeart, FaFire, FaLightbulb, FaMicrophone, FaMicrophoneSlash, FaCheckCircle, FaTimesCircle, FaRedo, FaShare, FaVolumeUp, FaStepForward, FaUsers } from 'react-icons/fa';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { characters as importedCharacters, Character as ImportedCharacter } from '@/data/characters';
import 'regenerator-runtime/runtime';
import Link from 'next/link';
import Guestbook from '@/components/Guestbook';

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// 확장된 Character 인터페이스 정의
interface Character extends Omit<ImportedCharacter, 'description'> {
  imageUrl: string;
  description: string; // 재정의된 설명
}

// QuizResult 인터페이스 개선
interface QuizResult {
  characterId: string;
  userInput: string;
  correct: boolean;
  time: number;
  date: string;
  pointsEarned: number;
  timeBonus: number;
  streakBonus: number;
  similarity: number;
  timeSpent?: number; // 옵셔널 필드 추가
  characterName?: string; // 옵셔널 필드 추가
}

// 랭킹 타입 정의
interface LocalRanking {
  id: string;
  name: string;
  score: number;
  timestamp: string;
}

// 이탈리아어 발음을 위한 텍스트 변환 함수
const getItalianPronunciation = (text: string, characterId?: string) => {
  // 캐릭터 ID가 있는 경우, 해당 ID를 반환하지 않고 원본 텍스트를 반환합니다
  // 이렇게 하면 TTS가 ID가 아닌 전체 이름을 읽습니다
  return text;
};

// Levenshtein 거리 계산 함수
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // 삭제
        matrix[j - 1][i] + 1, // 삽입
        matrix[j - 1][i - 1] + substitutionCost // 대체
      );
    }
  }

  return matrix[b.length][a.length];
};

// 음성 인식 효과를 최상단에서 일반 함수로 추출합니다
const setupSpeechRecognition = (
  onResult: (result: string) => void,
  onStart: () => void,
  onEnd: () => void,
  onError: (error: string) => void
) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    onError('이 브라우저는 음성 인식을 지원하지 않습니다.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log('음성 인식 시작');
    onStart();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    console.log('인식된 음성:', transcript);
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    console.error('음성 인식 오류:', event.error);
    onError(`음성 인식 오류: ${event.error}`);
  };

  recognition.onend = () => {
    console.log('음성 인식 종료');
    onEnd();
  };

  return recognition;
};

// 캐릭터 설명 매핑 추가
const getDescriptionMapping = (): Record<string, string> => {
  return {
    'tralalero': '파도조종, 빠른 달리기 속도, 슈퍼 점프, 강한 저작력을 가진 상어 캐릭터. 나이키 운동화를 신고 있으며, Italian Brainrot에서 가장 유명한 캐릭터입니다. 아들들과 포트나이트를 즐기는 것이 취미입니다.',
    'bombardiro': '폭격과 비행 능력을 가진 악어와 폭격기를 합성한 캐릭터. Tralalero tralala 다음으로 유명합니다. 상공에서 폭탄을 떨어뜨리는 공격 방식을 사용합니다.',
    'bombombini': '폭격과 비행 능력을 가진 거위와 제트 전투기를 합성한 캐릭터. Bombardiro Crocodilo와 형제 관계이며 마찬가지로 폭격하는 것이 취미입니다.',
    'tripi': '빠른 헤엄, 파동, 해일, 고양이 음파, 물기 능력을 가진 캐릭터. 새우와 고양이를 합친 모습을 하고 있습니다.',
    'burbaloni': '수영을 잘하는 코코넛 안에 카피바라가 들어있는 캐릭터. 발리 해안가에서 발견되면 지역 주민들이 모닥불 주위에 모여 도착을 축하합니다.',
    'tracotocutulo': '시간 정지 능력을 가진 샌들을 신고 몸이 선인장인 코끼리 캐릭터. 가지고 있는 시계로 전투에서 시간을 멈출 수 있습니다. 코끼리 특유의 체격과 긴 코를 활용한 기술적 싸움에 강합니다.',
    'brr': '숲 조종 능력, 함정 설치, 상대를 나무로 바꾸는 능력을 가진 캐릭터. 나무 팔다리에 코주부원숭이의 머리가 달린 모습입니다. 숲을 지키며 나무의 뿌리로 침입자를 공격합니다.',
    'trulimero': '수영을 잘하는 물고기의 몸통에 고양이의 머리, 사람의 다리 4개가 붙어있는 캐릭터입니다.',
    'frigo': '찬 바람 내뱉기 능력을 가진 냉장고 몸통을 한 낙타 캐릭터. 신발을 신고 있으며, 입에서 찬 바람이 나옵니다. 가끔 자신까지 얼려버리기도 합니다.',
    'frulli': '쪼기, 커피 마시기 능력을 가진 동그란 고글을 쓴 조류 캐릭터입니다.',
    'vaca': '행복 전파, 우주 비행, 브레스 분사 능력을 가진 캐릭터. 토성의 몸통에 사람의 발, 소의 머리를 하고 있습니다. 한 걸음마다 춤처럼 보이며 사람들을 즐겁게 만듭니다.',
    'bobritto': '총기 난사 능력을 가진 중절모를 쓰고 토미건을 든 비버 캐릭터. 은행을 털며 언제나 총기를 들고 담배를 물고 있습니다. 아마도 갱스터 조직원인 것 같습니다.',
    'giraffa': '수박씨를 초속 50km로 뱉는 능력을 가진 수박, 기린, 우주인을 모티브로 한 캐릭터입니다.',
    'cappuccino': '빠른 속도, 카타나 휘두르기, 은신 능력을 가진 카푸치노 커피에 서클렛, 칼, 팔다리가 달린 암살자 캐릭터. 물속에서도 매우 빠른 속도로 움직입니다.',
    'glorbo': '깨물기 능력을 가진 수박에 악어의 머리와 다리가 달린 캐릭터. 주로 늪지대에 서식하며, 몸무게는 304kg입니다.',
    'blueberrinni': '발판공격, 빠른 수영 능력을 가진 상반신이 블루베리인 문어 캐릭터. 블루베리만큼 작아서 공격을 피하기 쉽습니다.',
    'svinino': '자폭 능력을 가진 돼지와 폭탄을 합성한 캐릭터입니다.',
    'ballerina': '발레 능력을 가진 머리는 카푸치노이며, 분홍색 치마를 입은 발레리나 캐릭터. Cappuccino Assassino의 아내로, 음악을 사랑합니다.',
    'brii': '검술 능력을 가진 켄투리오 복장을 하고 목에 산딸기를 두른 조류 캐릭터. 체구는 작지만 자존심이 매우 큽니다.',
    'talpa': '주변 탐색, 스캔, 드릴 능력을 가진 몸 여러 부위가 기계화된 쥐 캐릭터. 눈과 이마에 스캔용 마이크로칩이 있고, 코에는 어떤 단단한 물체도 뚫을 수 있는 드릴이 있습니다.',
    'cacto': '밟기 능력을 가진 선인장 몸통에 하마의 머리를 하고 샌들을 신고 있는 캐릭터입니다.',
    'chef': '저주의 요리 능력을 가진 게의 머리와 집게가 달린 요리사 캐릭터. 원래는 어부였으나 바다 마녀와의 계약 후 게가 되었습니다. 집게로 무엇이든 찢고 차원의 포탈을 열 수 있습니다.',
    'chimpanzini': '민첩함, 바나나 벗기 능력을 가진 바나나 안에 초록색 침팬지가 들어간 캐릭터. 바나나를 벗으면 강력한 근육질 원숭이가 나옵니다.',
    'garamaraman': '소금 통과 꿀단지에 사람의 얼굴과 발을 합성한 캐릭터. 소금 통의 이름은 가라마라만, 꿀 통의 이름은 만두둥둥입니다. 원래는 사람이었으나 저주에 걸려 변했습니다.',
    'pothotspot': '핫스팟 요청, 무한으로 과자 사먹기 능력을 가진 해골과 핸드폰, 와이파이를 합성한 캐릭터. "Hotspot bro"라는 말을 자주 합니다.',
    'tung': '거인화, 야구방망이 스윙 능력을 가진 야구 방망이를 들고 있는 갈색 나무조각 캐릭터. 나무 갑옷을 장착한 거인으로 변신하는 능력이 있습니다.',
    'tata': '증기 생성, 굉장한 발차기 능력을 가진 주전자와 다리, 팔, 얼굴을 합성한 캐릭터. 항상 울상이며 슬플 때 주전자 입구에서 증기가 나옵니다.',
    'udin': '반복되는 소리로 노래하는 캐릭터로 U Din Din Din Din Dun Ma Din Din Din Dun이라는 이름을 가지고 있습니다. 중독성 있는 멜로디가 특징입니다.',
    'trippa': '뒤집힌 트로파 트리파 캐릭터로 세상을 거꾸로 보는 독특한 시각을 가지고 있습니다.',
    'boneca': '높은 점프 능력, 강한 발차기, 긴 혀를 가진 머리는 개구리, 몸통은 타이어, 다리는 사람 다리인 캐릭터. 기름을 넣다가 갑자기 석유가 쏟아져 이렇게 변했다는 설정이 있습니다.',
    'bombardiere': '폭격, 비행, 위장 능력을 가진 폭격기와 도마뱀을 합성한 캐릭터. Bombardiro Crocodillo를 업그레이드하는 과정에서 개발되었습니다.',
    'trippatroppa': '가장 유명한 캐릭터 6인방인 트리피 트로피, 트랄랄레로 트랄랄라, 리릴리 라릴라, 퉁 퉁 퉁 사후르, 보네카 암발라부, 봄바르디로 크로코딜로가 합쳐진 캐릭터로 italian brainrot의 최강자입니다.'
  };
};

// 캐릭터 데이터 처리 함수 수정
const processCharacters = (data: any): Character[] => {
  console.log("캐릭터 처리 시작, 데이터 길이:", data?.length);
  
  try {
    // 데이터 유효성 검사
    if (!Array.isArray(data) || data.length === 0) {
      console.error("유효한 캐릭터 데이터가 없습니다. importedCharacters 사용");
      // 대신 importedCharacters 사용
      return processImportedCharacters();
    }

    // ID가 없는 캐릭터에게 랜덤 ID 할당
    const dataWithIds = data.map(char => {
      if (!char.id) {
        return { ...char, id: `character-${Math.random().toString(36).substr(2, 9)}` };
      }
      return char;
    });

    // 필수 필드가 있는 캐릭터만 필터링
    const validCharacters = dataWithIds.filter(char => {
      const isValid = char && char.name;
      if (!isValid) {
        console.warn("유효하지 않은 캐릭터 건너뜀:", char);
      }
      return isValid;
    });

    if (validCharacters.length === 0) {
      console.error("유효한 캐릭터가 없습니다. importedCharacters 사용");
      return processImportedCharacters();
    }

    console.log("유효한 캐릭터 수:", validCharacters.length);

    // 캐릭터 랜덤 셔플 및 5개 선택
    const shuffled = [...validCharacters].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    console.log("선택된 캐릭터 이름:", selected.map(c => c.name).join(", "));
    
    return selected;
  } catch (error) {
    console.error("캐릭터 처리 중 오류 발생:", error);
    return processImportedCharacters();
  }
};

// 임포트된 캐릭터 데이터 처리 함수
const processImportedCharacters = (): Character[] => {
  try {
    console.log("임포트된 캐릭터 데이터 처리 시작");
    
    // 필수 필드 확인
    const validCharacters = importedCharacters.filter(char => 
      char && char.id && char.name && char.image
    );
    
    console.log(`유효한 캐릭터 수: ${validCharacters.length}`);
    
    if (validCharacters.length === 0) {
      throw new Error("유효한 임포트 캐릭터가 없습니다");
    }
    
    // Character 인터페이스에 맞게 변환
    const processedChars = validCharacters.map(char => ({
      id: char.id,
      name: char.name,
      description: char.description || char.name,
      imageUrl: `/characters/${char.image}` // 이미지 경로 조정
    }));
    
    // 랜덤하게 5개 선택 - 항상 5개 보장
    const shuffled = [...processedChars].sort(() => 0.5 - Math.random());
    
    // 사용 가능한 캐릭터가 5개 미만인 경우 중복 허용하여 5개 채우기
    let selected: Character[] = [];
    if (shuffled.length >= 5) {
      selected = shuffled.slice(0, 5);
    } else {
      // 부족한 수만큼 반복하여 채우기
      while (selected.length < 5) {
        const availableChars = shuffled.length > 0 ? shuffled : processedChars;
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        selected.push({...availableChars[randomIndex]}); // 깊은 복사로 중복 허용
      }
    }
    
    console.log("선택된 캐릭터 이름:", selected.map(c => c.name).join(", "));
    console.log("선택된 캐릭터 수:", selected.length);
    
    return selected;
  } catch (error) {
    console.error("임포트된 캐릭터 처리 중 오류:", error);
    // 최소한의 기본 캐릭터 반환 - 5개 보장
    return [
      {
        id: "default-character-1",
        name: "디폴트 캐릭터 1",
        imageUrl: "/characters/default.jpg",
        description: "기본 캐릭터 1"
      },
      {
        id: "default-character-2",
        name: "디폴트 캐릭터 2",
        imageUrl: "/characters/default.jpg",
        description: "기본 캐릭터 2"
      },
      {
        id: "default-character-3",
        name: "디폴트 캐릭터 3",
        imageUrl: "/characters/default.jpg",
        description: "기본 캐릭터 3"
      },
      {
        id: "default-character-4",
        name: "디폴트 캐릭터 4",
        imageUrl: "/characters/default.jpg",
        description: "기본 캐릭터 4"
      },
      {
        id: "default-character-5",
        name: "디폴트 캐릭터 5",
        imageUrl: "/characters/default.jpg",
        description: "기본 캐릭터 5"
      }
    ];
  }
};

// 효과음 재생 함수 추가
const playSuccessSound = () => {
  const audio = new Audio('/sounds/success.mp3');
  audio.play().catch(err => console.error('오디오 재생 오류:', err));
};

const playFailureSound = () => {
  const audio = new Audio('/sounds/failure.mp3');
  audio.play().catch(err => console.error('오디오 재생 오류:', err));
};

export default function Home() {
  // 게임 상태 관련 state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 클릭 처리 중 상태 추가
  const [micPermissionGranted, setMicPermissionGranted] = useState(false); // 마이크 권한 상태 추가
  const [timeLeft, setTimeLeft] = useState(15);
  const [name, setName] = useState("");
  const [hints, setHints] = useState<Record<string, boolean>>({}); // 힌트 표시 여부
  const [showHint, setShowHint] = useState(false);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [showRankingForm, setShowRankingForm] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [processedCharacters, setProcessedCharacters] = useState<Character[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showGameResults, setShowGameResults] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [ttsPronounced, setTtsPronounced] = useState(false); // TTS 실행 여부 추적
  const [visitorCount, setVisitorCount] = useState<number>(13000);
  const visitedRef = useRef<boolean>(false);
  
  // 참조 변수들 정의
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 현재 재생 중인 TTS 오디오 객체 저장
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 마지막 TTS 재생 시간 추적
  const lastTtsPlayedRef = useRef<number>(0);
  // 마지막 문제 전환 시간 추적
  const lastQuestionChangeRef = useRef<number>(0);

  // 타이머 설정
  useEffect(() => {
    // 게임 종료 시 또는 컴포넌트 언마운트 시 실행될 정리 함수
    const cleanupTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log("타이머 정리 완료");
      }
    };

    // 게임 중이고 결과를 보여주지 않을 때만 타이머 동작
    if (gameState === 'playing' && !showResult && isTimerRunning) {
      // 기존 타이머 제거
      cleanupTimer();
      
      console.log(`타이머 시작: ${timeLeft}초`);
      
      // 새 타이머 시작
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTimeLeft = prev - 1;
          // 시간이 다 되면 자동으로 시간 초과 처리
          if (newTimeLeft <= 0) {
            console.log("타이머 종료 - 시간 초과");
            cleanupTimer();
            
            // 시간 초과 처리 함수 호출
            handleTimeOut();
            return 0;
          }
          
          return newTimeLeft;
        });
      }, 1000);
    } else if (!isTimerRunning || gameState !== 'playing' || showResult) {
      // 타이머를 실행하지 않아야 하는 경우 정리
      cleanupTimer();
    }
    
    // 컴포넌트 언마운트 시 타이머 정리
    return cleanupTimer;
  }, [gameState, showResult, isTimerRunning, timeLeft]);

  // 시간 초과 처리 함수 추가
  const handleTimeOut = useCallback(() => {
    console.log("시간 초과 처리 시작");
    
    // 음성 인식 중지
    if (recognition) {
      try {
        recognition.abort();
        setRecognition(null);
        setIsListening(false);
      } catch (error) {
        console.error("시간 초과로 인한 음성 인식 중지 오류:", error);
      }
    }
    
    // 시간 초과 메시지와 자동 오답 처리
    setAnswer("시간 초과");
    setIsCorrect(false);
    setShowResult(true);
    setIsTimerRunning(false);
    
    // 오답 처리 - 목숨 감소
    setLives(prev => Math.max(0, prev - 1));
    setStreak(0);
    
    // 오답 결과 생성
    if (processedCharacters.length > 0 && currentCharacterIndex >= 0 && currentCharacterIndex < processedCharacters.length) {
      const currentCharacter = processedCharacters[currentCharacterIndex];
      const result: QuizResult = {
        characterId: currentCharacter.id,
        userInput: "시간 초과",
        correct: false,
        time: 15,
        date: new Date().toISOString(),
        pointsEarned: 0,
        timeBonus: 0,
        streakBonus: 0,
        similarity: 0,
        timeSpent: 15,
        characterName: currentCharacter.name
      };
      
      setLastResult(result);
      setQuizResults(prev => [...prev, result]);
      
      // 다음 문제 이동 또는 게임 종료 확인
      const isLastQuestion = currentCharacterIndex >= processedCharacters.length - 1;
      const hasLivesLeft = lives > 1; // 감소 전에 체크했으므로 1보다 크면 아직 목숨 남음
      
      console.log(`시간 초과 처리: 마지막 문제=${isLastQuestion}, 남은 목숨=${hasLivesLeft ? '있음' : '없음'}`);
      
      // 짧은 대기 후 다음 문제로 이동 또는 게임 종료
      setTimeout(() => {
        setShowResult(false);
        
        if (!hasLivesLeft || isLastQuestion) {
          // 게임 종료 조건: 목숨 없음 또는 마지막 문제
          console.log(`게임 종료 - ${!hasLivesLeft ? '목숨 소진' : '모든 문제 완료'}`);
          setGameState('results');
          setIsPlaying(false);
        } else {
          // 다음 문제로 이동
          const nextIndex = currentCharacterIndex + 1;
          console.log(`다음 문제로 이동: ${nextIndex + 1}/${processedCharacters.length}`);
          
          setCurrentCharacterIndex(nextIndex);
          setTimeLeft(15);
          setUserInput('');
          setAnswer('');
          setIsTimerRunning(true);
          
          // 다음 문제 이름 재생
          if (processedCharacters.length > nextIndex) {
            setTimeout(() => {
              playTTS(processedCharacters[nextIndex]?.name || '');
            }, 500);
          }
        }
      }, 3000);
    }
  }, [currentCharacterIndex, lives, processedCharacters, recognition]);
  
  // 게임 시작 함수 수정
  const handleStartGame = () => {
    console.log('게임 시작');
    
    // 이미 로드된 캐릭터가 없으면 다시 로드
    let charactersToUse = processedCharacters;
    if (processedCharacters.length === 0) {
      charactersToUse = processImportedCharacters();
      setProcessedCharacters(charactersToUse);
    }
    
    // 상태 초기화
    setGameState('playing');
    setIsPlaying(true);
    setScore(0);
    setStreak(0);
    setLives(3);
    setCurrentCharacterIndex(0);
    setShowResult(false);
    setQuizResults([]);
    setTimeLeft(15);
    setHints({});
    setIsTimerRunning(true);
    setTtsPronounced(false);
    
    // 게임 시작 시 약간의 지연 후 자동으로 첫 문제의 이름 TTS 재생
    setTimeout(() => {
      if (charactersToUse.length > 0) {
        playTTS(charactersToUse[0]?.name || '');
      }
    }, 500);
    
    console.log('게임 시작 완료, 문제 수:', charactersToUse.length);
  };
  
  // 다음 문제로 이동 함수 수정
  const handleNext = () => {
    const now = Date.now();
    
    // 0.5초 이내에 중복 호출 방지
    if (now - lastQuestionChangeRef.current < 500) {
      console.log("다음 문제로 이동 요청이 너무 빠릅니다. 무시됨.");
      return;
    }
    
    lastQuestionChangeRef.current = now;
    
    // 현재 인식 중이면 중지
    if (recognition) {
      try {
        recognition.abort();
        setRecognition(null);
        setIsListening(false);
      } catch (error) {
        console.error("다음 문제 이동 시 음성 인식 중지 오류:", error);
      }
    }
    
    // 재생 중인 TTS 중지
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      } catch (error) {
        console.error("TTS 오디오 중지 중 오류:", error);
      }
    }
    
    // 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // 현재 문제 인덱스와 총 문제 수 로깅
    console.log(`다음 문제로 이동: ${currentCharacterIndex + 1}/${processedCharacters.length}`);
    
    if (currentCharacterIndex < processedCharacters.length - 1) {
      // 다음 문제로 이동
      const nextIndex = currentCharacterIndex + 1;
      setCurrentCharacterIndex(nextIndex);
      setTimeLeft(15);
      setShowResult(false);
      setAnswer('');
      setUserInput('');
      setIsListening(false);
      setIsTimerRunning(true);
      setTtsPronounced(false);
      
      // 다음 문제로 넘어간 후 약간의 지연 후 자동으로 이름 TTS 재생
      // 지연 시간을 늘려서 이전 작업이 모두 정리되도록 함
      setTimeout(() => {
        if (processedCharacters.length > nextIndex) {
          playTTS(processedCharacters[nextIndex]?.name || '');
        }
      }, 800); // 500ms에서 800ms로 증가
    } else {
      // 모든 문제 완료 - 로깅 추가
      console.log("모든 문제 완료 - 게임 종료");
      setGameState('results');
      setShowGameResults(true);
      setIsPlaying(false);
      setIsTimerRunning(false);
    }
  };
  
  // 게임 재시작 함수
  const handleRestart = () => {
    // 게임 상태 초기화
    setGameState('intro');
    setScore(0);
    setStreak(0);
    setLives(3);
    setCurrentCharacterIndex(0);
    setTimeLeft(15);
    setShowHint(false);
    setIsListening(false);
    setIsTimerRunning(false);
    setShowResult(false);
    setUserInput('');
    setAnswer('');
    setIsCorrect(null);
    setLastResult(null);
    setQuizResults([]);
    // 힌트 초기화
    const newHints: { [key: string]: boolean } = {};
    setHints(newHints);
  };
  
  // 힌트 표시 함수
  const showHintForCurrentCharacter = () => {
    if (processedCharacters.length > 0 && currentCharacterIndex >= 0) {
      const currentId = processedCharacters[currentCharacterIndex].id;
      setHints(prev => ({...prev, [currentId]: true}));
    }
  };
  
  // 랭킹 제출 함수
  const handleSubmitRanking = async (name: string) => {
    if (name.trim() === '') {
      alert('이름을 입력해주세요');
      return;
    }
    
    try {
      // 로컬 스토리지에 먼저 저장 (오프라인 대비)
      const ranking = {
        name,
        score,
        timestamp: new Date().toISOString(),
        id: `local-${Date.now()}`
      };
      
      // 로컬 스토리지에 랭킹 저장
      try {
        const existingRankings = JSON.parse(localStorage.getItem('rankings') || '[]');
        existingRankings.push(ranking);
        localStorage.setItem('rankings', JSON.stringify(existingRankings));
        console.log('랭킹이 로컬에 저장되었습니다:', ranking);
      } catch (localError) {
        console.error('로컬 저장 오류:', localError);
      }
      
      // Firebase 저장 시도
      try {
        await addDoc(collection(db, 'rankings'), {
          name,
          score,
          timestamp: new Date(),
        });
        console.log('랭킹이 Firebase에 저장되었습니다');
      } catch (firebaseError) {
        console.error('Firebase 랭킹 저장 오류:', firebaseError);
        // Firebase 오류가 발생해도 사용자에게는 성공 메시지 표시 (로컬에는 저장됨)
      }
      
      alert('랭킹이 제출되었습니다!');
      setShowNameInput(false);
      
    } catch (error) {
      console.error('랭킹 제출 중 오류 발생:', error);
      alert('랭킹 제출에 일부 문제가 있었지만, 로컬에 저장되었습니다.');
    }
  };
  
  // TTS 재생 함수 수정
  const playTTS = async (text: string) => {
    try {
      const now = Date.now();
      
      // 0.8초 이내에 중복 호출 방지
      if (now - lastTtsPlayedRef.current < 800) {
        console.log("TTS 재생 요청이 너무 빠릅니다. 무시됨.");
        return;
      }
      
      // 재생 시간 업데이트
      lastTtsPlayedRef.current = now;
      
      console.log("TTS 재생 시작:", text);
      
      // 이미 재생 중인 오디오가 있으면 중지
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (e) {
          console.error("이전 TTS 오디오 중지 중 오류:", e);
        }
      }
      
      // TTS 재생 중일 때는 음성인식 중지
      if (recognition) {
        try {
          recognition.abort();
          setRecognition(null);
          setIsListening(false);
        } catch (error) {
          console.error("TTS 재생 전 음성 인식 중지 오류:", error);
        }
      }
      
      const url = await textToSpeech(text);
      if (url) {
        const audio = new Audio(url);
        
        // 오디오 참조 저장
        audioRef.current = audio;
        
        // 오디오 재생 완료 이벤트 핸들러 추가
        audio.onended = () => {
          console.log("TTS 재생 완료");
          setTtsPronounced(true);
          audioRef.current = null;
          // 자동 음성인식 시작 코드 제거 - 사용자가 직접 버튼을 눌러야만 시작됨
        };
        
        // 오류 이벤트 핸들러 추가
        audio.onerror = (e) => {
          console.error("TTS 오디오 재생 오류:", e);
          audioRef.current = null;
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('TTS 재생 오류:', error);
      audioRef.current = null;
    }
  };
  
  // 진행률 계산
  const progressPercentage = processedCharacters.length > 0 
    ? ((currentCharacterIndex + 1) / processedCharacters.length) * 100
    : 0;

  // 캐릭터 데이터 초기화
  useEffect(() => {
    let isMounted = true;
    const loadCharacters = async () => {
      try {
        console.log("캐릭터 데이터 로딩 시작");
        
        // importedCharacters에서 직접 가져오기
        const processed = processImportedCharacters();
        
        if (isMounted && processed.length > 0) {
          setProcessedCharacters(processed);
          setLoadError(null);
          console.log("처리된 캐릭터:", processed.length);
        } else {
          throw new Error("캐릭터 처리 실패");
        }
      } catch (error) {
        console.error("캐릭터 데이터 로딩 오류:", error);
        if (isMounted) {
          setLoadError("캐릭터 데이터 로드 실패");
          // 기본 캐릭터 없이 오류 상태만 설정
        }
      }
    };

    loadCharacters();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 음성인식 정답 처리 함수 수정
  const handleAnswer = (userInput: string) => {
    try {
      // 타이머 정지
      setIsTimerRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // TTS 재생 중이면 중지
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        } catch (error) {
          console.error("정답 처리 중 TTS 중지 오류:", error);
        }
      }
      
      if (!processedCharacters || processedCharacters.length === 0) {
        console.error("처리된 캐릭터가 없습니다");
        return;
      }

      if (currentCharacterIndex < 0 || currentCharacterIndex >= processedCharacters.length) {
        console.error("현재 캐릭터 인덱스가 범위를 벗어났습니다:", currentCharacterIndex, "전체 캐릭터 수:", processedCharacters.length);
        return;
      }

      const currentCharacter = processedCharacters[currentCharacterIndex];
      if (!currentCharacter || !currentCharacter.name) {
        console.error("현재 캐릭터 정보를 찾을 수 없습니다", currentCharacter);
        return;
      }

      console.log("정답 확인:", userInput, "vs", currentCharacter.name);

      // Levenshtein 거리 계산 - 정확도 요구사항 크게 낮춤
      const distance = levenshteinDistance(userInput.toLowerCase(), currentCharacter.name.toLowerCase());
      const maxDistance = Math.floor(currentCharacter.name.length * 0.9); // 이름 길이의 90%까지 오차 허용(10%만 맞으면 정답)
      const isUserCorrect = distance <= maxDistance;

      // 점수 계산
      const accuracyPercentage = Math.max(0, 100 - (distance / currentCharacter.name.length) * 100);
      const accuracyValue = Math.min(100, Math.max(0, Math.round(accuracyPercentage)));
      const timeBonus = Math.round(timeLeft * 10);
      const pointsEarned = isUserCorrect ? Math.round(100 + timeBonus + (accuracyValue / 2)) : 0;
      const streakBonus = isUserCorrect && streak > 0 ? Math.round(streak * 20) : 0;
      const totalPoints = pointsEarned + streakBonus;

      console.log("정답 결과:", 
        isUserCorrect ? "정답" : "오답",
        "점수:", totalPoints, 
        "정확도:", accuracyValue,
        "허용 거리:", maxDistance,
        "실제 거리:", distance
      );

      // 현재 시간 기록
      const currentTime = new Date().toISOString();
      const responseTime = 15 - timeLeft;

      // 결과 저장
      const result: QuizResult = {
        characterId: currentCharacter.id,
        userInput: userInput,
        correct: isUserCorrect,
        time: responseTime,
        date: currentTime,
        pointsEarned: totalPoints,
        timeBonus: timeBonus,
        streakBonus: streakBonus,
        similarity: accuracyValue,
        timeSpent: responseTime,
        characterName: currentCharacter.name
      };

      setLastResult(result);
      setQuizResults(prev => [...prev, result]);
      setIsCorrect(isUserCorrect);
      setShowResult(true);
      setIsListening(false);
      setAnswer(userInput);
      
      // 점수 및 스트릭 업데이트
      if (isUserCorrect) {
        setScore(prev => prev + totalPoints);
        setStreak(prev => prev + 1);
      } else {
        setLives(prev => prev - 1);
        setStreak(0);
      }

      // 결과 표시 후 다음 문제 또는 게임 종료 처리
      setTimeout(() => {
        console.log("다음 문제로 진행 시작, showResult:", showResult);
        setShowResult(false);
        setUserInput('');
        setAnswer('');
        setIsCorrect(null);
        setIsListening(false); // 명시적으로 음성 인식 상태 초기화

        // 현재 진행상황 로깅
        console.log(`문제 진행상황: ${currentCharacterIndex + 1}/${processedCharacters.length}, 정답여부: ${isUserCorrect}, 남은 목숨: ${isUserCorrect ? lives : lives - 1}`);

        // 다음 문제 또는 결과 화면으로 자동 이동
        if (isUserCorrect || lives > 1) {
          if (currentCharacterIndex < processedCharacters.length - 1) {
            // 마지막 문제 전환 시간 기록
            lastQuestionChangeRef.current = Date.now();
            
            // 다음 문제로 이동
            console.log("다음 문제로 이동 처리 중...");
            const nextIndex = currentCharacterIndex + 1;
            setCurrentCharacterIndex(nextIndex);
            setTimeLeft(15);
            setShowHint(false);
            setIsTimerRunning(true);
            
            // 다음 문제로 넘어간 후 약간의 지연 후 자동으로 이름 TTS 재생
            // 지연 시간을 늘려서 이전 작업이 모두 정리되도록 함
            setTimeout(() => {
              if (processedCharacters.length > nextIndex) {
                console.log(`다음 문제(${nextIndex + 1}/${processedCharacters.length}) TTS 재생`);
                playTTS(processedCharacters[nextIndex]?.name || '');
              }
            }, 800); // 300ms에서 800ms로 증가
          } else {
            // 모든 문제 완료 - 로깅 추가
            console.log("모든 문제 완료 - 결과 화면으로 이동");
            setGameState('results');
            setShowRankingForm(true); // 랭킹 등록 폼 표시 추가
            setIsPlaying(false);
            setIsTimerRunning(false);
            // 디버깅 - 랭킹 등록 폼 표시 여부 확인
            console.log("게임 종료 시점 showRankingForm 값:", showRankingForm);
            // 랭킹 폼 표시 추가 - 이 부분이 없었을 가능성이 높음
            setShowRankingForm(true);
            console.log("showRankingForm을 true로 설정:", true);
          }
        } else {
          // 목숨을 모두 소진한 경우 - 로깅 추가
          console.log("목숨 모두 소진 - 결과 화면으로 이동");
          setGameState('results');
          setShowRankingForm(true); // 랭킹 등록 폼 표시 추가
          setIsPlaying(false);
          setIsTimerRunning(false);
          // 디버깅 - 랭킹 등록 폼 표시 여부 확인
          console.log("목숨 소진 시점 showRankingForm 값:", showRankingForm);
          // 랭킹 폼 표시 추가 - 이 부분이 없었을 가능성이 높음
          setShowRankingForm(true);
          console.log("showRankingForm을 true로 설정:", true);
        }
      }, 500);
    } catch (error) {
      console.error("정답 처리 중 오류 발생:", error);
    }
  };

  // 음성인식 버튼 클릭 핸들러 함수
  const handleSpeechRecognition = () => {
    console.log('음성 인식 버튼 클릭:', { hasRecognition: !!recognition, isListening });
    
    // 처리 중일 때는 중복 클릭 방지
    if (isProcessing) {
      console.log('이미 처리 중입니다.');
      return;
    }
    
    if (!processedCharacters || processedCharacters.length === 0) {
      alert('게임이 시작되지 않았습니다. 게임 시작 버튼을 클릭하세요.');
      return;
    }
    
    if (showResult) {
      alert('현재 결과가 표시 중입니다. 다음 문제로 넘어가려면 "다음 문제" 버튼을 클릭하세요.');
      return;
    }
    
    // 처리 시작
    setIsProcessing(true);
    
    // 음성 인식 중이면 중지
    if (isListening) {
      console.log('음성 인식 중지 시도');
      
      // UI 상태 업데이트 지연 (모바일에서 너무 빠르게 상태 변경되는 것 방지)
      // 실제 중지 작업 먼저 실행
      if (recognition) {
        try {
          recognition.abort(); // abort로 변경하여 의도적인 중단임을 표시
          setRecognition(null);
        } catch (error) {
          console.error("음성 인식 중지 중 오류:", error);
        }
      } else {
        console.warn("중지하려고 했으나 recognition 객체가 없습니다.");
      }
      
      // 약간의 지연 후에 상태 업데이트 (UI 깜빡임 방지)
      setTimeout(() => {
        setIsListening(false);
      }, 100);
    } 
    // 음성 인식 중이 아니면 시작
    else {
      console.log('음성 인식 시작 시도');
      
      // UI 상태 즉시 업데이트
      setIsListening(true);
      
      // 브라우저 음성인식 지원 여부 확인 후 시작
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechRecognitionError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        setTimeout(() => setIsListening(false), 100);
        setIsProcessing(false);
        return;
      }
      
      // 음성 인식 시작
      startSpeechRecognition();
    }
    
    // 짧은 지연 후 처리 상태 해제
    setTimeout(() => {
      setIsProcessing(false);
    }, 800);
  };

  // 음성인식 시작 함수
  const startSpeechRecognition = () => {
    // 이미 음성인식 객체가 있으면 중복 실행 방지
    if (recognition) {
      console.log('이미 음성인식 객체가 존재합니다:', { hasRecognition: !!recognition });
      return;
    }
    
    try {
      // 브라우저 음성인식 지원 여부 확인
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechRecognitionError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        setIsListening(false);
        setIsProcessing(false);
        return;
      }
      
      // 모바일 디바이스 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log(`디바이스 타입: ${isMobile ? '모바일' : '데스크탑'}`);
      
      const recognitionInstance = new SpeechRecognition();
      
      // 기본 설정
      recognitionInstance.lang = 'it-IT'; // 이탈리아어 인식
      recognitionInstance.continuous = isMobile; // 모바일에서는 연속 인식 활성화
      recognitionInstance.interimResults = isMobile; // 모바일에서는 중간 결과 사용
      
      // 추가 설정
      if ('maxAlternatives' in recognitionInstance) {
        (recognitionInstance as any).maxAlternatives = 5; // 여러 대안 인식 결과 제공
      }
      
      // 시작 이벤트
      recognitionInstance.onstart = () => {
        console.log("음성인식 시작됨");
        // 마이크 권한 획득 표시
        setMicPermissionGranted(true);
        // UI 상태가 이미 설정되어 있으므로 추가 설정 없음
      };
      
      // 결과 이벤트
      recognitionInstance.onresult = (event: any) => {
        try {
          console.log("음성 인식 결과 이벤트:", event);
          
          let finalTranscript = '';
          
          // 모바일에서는 중간 결과를 포함할 수 있음
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
          
          // 결과가 없으면 첫 번째 결과 사용
          if (!finalTranscript && event.results.length > 0) {
            finalTranscript = event.results[0][0].transcript;
          }
          
          console.log("최종 인식된 음성:", finalTranscript);
          
          if (finalTranscript) {
            // 음성 인식 결과 처리
            setUserInput(finalTranscript);
            setAnswer(finalTranscript);
            
            // 음성인식 객체 초기화 (결과를 받은 후 클린업)
            if (recognition) {
              try {
                recognition.abort();
              } catch (e) {
                console.error("결과 수신 후 음성인식 중지 중 오류:", e);
              }
            }
            setRecognition(null);
            
            // 약간의 지연 후 자동 제출
            setTimeout(() => {
              if (!showResult) {
                handleAnswer(finalTranscript);
              }
              
              // 약간의 지연 후 상태 업데이트
              setTimeout(() => {
                setIsListening(false);
              }, 200);
            }, 200);
          } else {
            console.warn("유효한 음성 인식 결과가 없습니다.");
          }
        } catch (error) {
          console.error("음성 인식 결과 처리 중 오류:", error);
          // 오류 발생 시에도 일정 시간 후 상태 업데이트
          setTimeout(() => {
            setIsListening(false);
          }, 200);
        }
      };
      
      // 오류 이벤트
      recognitionInstance.onerror = (event: any) => {
        console.error("음성인식 오류:", event.error);
        // aborted 오류는 의도적인 중단이므로 오류 메시지 표시하지 않음
        if (event.error !== 'aborted') {
          let errorMessage = `음성 인식 오류: ${event.error}`;
          
          // 모바일 기기별 추가 안내 메시지
          if (isMobile) {
            if (event.error === 'no-speech') {
              errorMessage = '음성이 감지되지 않았습니다. 더 크게 말해보세요.';
            } else if (event.error === 'network') {
              errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하세요.';
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              errorMessage = '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
              setMicPermissionGranted(false);
            }
          }
          
          setSpeechRecognitionError(errorMessage);
          
          // 3초 후 오류 메시지 제거
          setTimeout(() => {
            setSpeechRecognitionError(null);
          }, 3000);
        }
        
        // 오류 발생 시 약간의 지연 후 상태 초기화
        setTimeout(() => {
          setIsListening(false);
          setRecognition(null);
        }, isMobile ? 200 : 0);
        
        // 모바일에서 자동으로 재시작하는 코드 제거
      };
      
      // 종료 이벤트
      recognitionInstance.onend = () => {
        console.log("음성인식 종료됨");
        
        // 모바일에서는 음성 인식이 자동으로 종료될 수 있으므로
        // 의도적으로 종료된 경우가 아니라면 상태를 유지
        if (isMobile && micPermissionGranted) {
          // 모바일에서 의도하지 않은 종료 시 딜레이 후 상태 변경
          // 이렇게 하면 빠르게 종료되더라도 UI에 표시된 상태는 유지됨
          setTimeout(() => {
            // 만약 recognition이 null이고(의도적 종료) isListening이 여전히 true라면
            // 이때만 상태를 false로 변경
            if (!recognition && isListening) {
              setIsListening(false);
            }
          }, 500);
        } else {
          // 데스크탑이나 의도적 종료의 경우 바로 상태 변경
          setIsListening(false);
          setRecognition(null);
        }
      };
      
      // 전역 변수에 인스턴스 저장 (정지 버튼에서 사용)
      setRecognition(recognitionInstance);
      
      // 음성인식 시작
      try {
        recognitionInstance.start();
        console.log("음성인식 시작 요청됨");
      } catch (startError) {
        console.error("음성인식 시작 요청 중 오류:", startError);
        
        // 시작 실패 시 약간의 지연 후 상태 초기화
        setTimeout(() => {
          setIsListening(false);
          setRecognition(null);
        }, 200);
        
        setSpeechRecognitionError("음성 인식 시작에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("음성인식 설정 중 오류 발생:", error);
      
      // 오류 발생 시 약간의 지연 후 상태 초기화
      setTimeout(() => {
        setIsListening(false);
        setRecognition(null);
      }, 200);
      
      setSpeechRecognitionError("음성 인식을 시작할 수 없습니다. 브라우저 설정을 확인하세요.");
    }
  };

  // 음성인식 설정 - 자동 시작 제거
  useEffect(() => {
    // 컴포넌트 언마운트 시 정리만 수행
    return () => {
      if (recognition) {
        try {
          recognition.abort();
          console.log("컴포넌트 언마운트로 음성인식 중지");
        } catch (error) {
          console.error("음성인식 정리 중 오류:", error);
        }
      }
    };
  }, []);

  // 결과 화면 렌더링
  const renderResults = () => {
    // 디버깅 - 결과 화면 렌더링 시 값 확인
    console.log("renderResults 호출됨, showRankingForm 값:", showRankingForm);
    // 맞은 문제 개수 계산
    const correctCount = quizResults.filter(result => result.correct).length;
    const totalQuestions = processedCharacters.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    // 평균 응답 시간 계산
    const averageResponseTime = quizResults.length > 0 
      ? quizResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0) / quizResults.length 
      : 0;
    
    // 랭킹 계산 처리
    let rankInfo = {
      rank: 0,
      totalPlayers: 0,
      percentile: 0,
      isTopPlayer: false
    };

    // 로컬 스토리지에서 모든 랭킹 가져오기
    try {
      let allRankings: LocalRanking[] = JSON.parse(localStorage.getItem('rankings') || '[]');
      
      // 점수 기준 내림차순 정렬
      allRankings.sort((a: LocalRanking, b: LocalRanking) => b.score - a.score);
      
      // 총 플레이어 수
      rankInfo.totalPlayers = allRankings.length;
      
      // 현재 점수보다 높은 점수를 가진 플레이어 수 확인
      const betterScores = allRankings.filter(r => r.score > score).length;
      
      // 동일한 점수를 가진 플레이어 수 확인
      const sameScores = allRankings.filter(r => r.score === score).length;
      
      // 랭킹 계산
      rankInfo.rank = betterScores + 1;
      
      // 상위 % 계산
      if (allRankings.length > 0) {
        rankInfo.percentile = Math.round(((allRankings.length - betterScores) / allRankings.length) * 100);
      }
      
      // 상위 10% 이내인지 확인
      rankInfo.isTopPlayer = rankInfo.percentile >= 90;
    } catch (e) {
      console.error('랭킹 계산 중 오류:', e);
    }
    
    return (
      <motion.div
        className="flex flex-col items-center justify-center w-full p-6 bg-white rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-purple-800">퀴즈 결과</h2>
        
        <div className="stats-container w-full mb-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="stat-box p-4 bg-purple-100 rounded-lg text-center">
              <p className="text-gray-700 text-sm">최종 점수</p>
              <p className="text-4xl font-bold text-purple-700">{score}</p>
            </div>
            <div className="stat-box p-4 bg-blue-100 rounded-lg text-center">
              <p className="text-gray-700 text-sm">정확도</p>
              <p className="text-4xl font-bold text-blue-700">{accuracy}%</p>
            </div>
            <div className="stat-box p-4 bg-green-100 rounded-lg text-center">
              <p className="text-gray-700 text-sm">최대 연속</p>
              <p className="text-4xl font-bold text-green-700">{streak}</p>
            </div>
            <div className="stat-box p-4 bg-yellow-100 rounded-lg text-center">
              <p className="text-gray-700 text-sm">평균 응답 시간</p>
              <p className="text-4xl font-bold text-yellow-700">{averageResponseTime.toFixed(1)}초</p>
            </div>
          </div>
        </div>
        
        {/* 랭킹 정보 표시 - 신규 추가 */}
        {rankInfo.totalPlayers > 0 && (
          <div className="w-full mb-8 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-indigo-800 text-center">내 랭킹 정보</h3>
            
            <div className="flex justify-center items-center mb-4">
              <div className={`relative w-24 h-24 flex items-center justify-center rounded-full 
                ${rankInfo.isTopPlayer ? 'bg-gradient-to-r from-yellow-300 to-amber-400' : 'bg-indigo-100'}`}>
                <div className="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-800">{rankInfo.rank}</p>
                    <p className="text-xs text-indigo-600 -mt-1">위</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-3">
              {rankInfo.isTopPlayer && (
                <p className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-900 rounded-full text-sm font-medium mb-2">
                  상위 플레이어 🏆
                </p>
              )}
              <p className="text-gray-700">
                {rankInfo.totalPlayers}명 중 <span className="font-semibold text-indigo-700">{rankInfo.rank}위</span>를 기록했습니다!
              </p>
              <p className="text-gray-700">
                상위 <span className="font-semibold text-indigo-700">{rankInfo.percentile}%</span> 이내의 성적입니다.
              </p>
            </div>
          </div>
        )}
        
        {/* 모든 캐릭터 표시 */}
        <div className="w-full mb-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-purple-700">퀴즈 캐릭터</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {processedCharacters.map((character, index) => {
              const result = quizResults.find(r => r.characterId === character.id);
              const isCorrect = result?.correct;
              
              return (
                <div key={character.id} className={`character-card p-3 rounded-lg border-2 ${
                  isCorrect === true ? 'border-green-500 bg-green-50' : 
                  isCorrect === false ? 'border-red-500 bg-red-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  <div className="w-full aspect-square mb-2 overflow-hidden rounded-lg">
                    <Image
                      src={character.imageUrl}
                      alt={character.name}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-800">{character.name}</p>
                    {result && (
                      <p className={`text-sm ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCorrect ? '정답' : '오답'} 
                        {result.userInput && !isCorrect && (
                          <span className="block text-xs text-gray-600">입력: {result.userInput}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 랭킹 등록 폼 개선 */}
        {showRankingForm ? (
          <div className="w-full mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-100 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-700 text-center">랭킹 등록</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full max-w-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition duration-300 flex items-center justify-center"
                onClick={() => handleSubmitRanking(name)}
                disabled={!name.trim()}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                랭킹 등록하기
              </motion.button>
              <p className="mt-2 text-sm text-gray-500">
                * 랭킹에 등록하면 다른 사람들과 점수를 비교할 수 있어요.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full mb-8 p-5 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
            <p className="text-center text-yellow-700 font-medium">랭킹 등록 폼이 표시되지 않았습니다.</p>
            <p className="text-center text-yellow-600 text-sm mb-3">등록을 통해 나의 순위를 확인해보세요.</p>
            <button 
              className="w-full max-w-xs mx-auto block bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition duration-200"
              onClick={() => {
                console.log("수동으로 showRankingForm 설정");
                setShowRankingForm(true);
              }}
            >
              랭킹 등록 폼 표시하기
            </button>
          </div>
        )}
        
        {/* 랭킹 목록 개선 */}
        <div className="w-full mb-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-purple-700 flex items-center justify-between">
            <span>랭킹 순위</span>
            <span className="text-sm font-normal text-purple-500">상위 10명</span>
          </h3>
          
          {/* 로컬 랭킹 데이터 표시 */}
          {(() => {
            // 로컬 스토리지에서 랭킹 데이터 가져오기
            let localRankings: LocalRanking[] = [];
            try {
              localRankings = JSON.parse(localStorage.getItem('rankings') || '[]');
              // 점수 기준 내림차순 정렬
              localRankings.sort((a: LocalRanking, b: LocalRanking) => b.score - a.score);
              // 상위 10개만 표시
              localRankings = localRankings.slice(0, 10);
            } catch (e) {
              console.error('로컬 랭킹 데이터 로드 오류:', e);
            }
            
            if (localRankings.length === 0) {
              return (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-gray-500">아직 랭킹 데이터가 없습니다.</p>
                  <p className="text-gray-400 text-sm">첫 번째 랭킹에 등록해보세요!</p>
                </div>
              );
            }
            
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-100 to-indigo-50 text-gray-700">
                      <th className="py-3 px-4 text-left font-medium">순위</th>
                      <th className="py-3 px-4 text-left font-medium">이름</th>
                      <th className="py-3 px-4 text-right font-medium">점수</th>
                      <th className="py-3 px-4 text-right font-medium">날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localRankings.map((ranking: LocalRanking, index: number) => {
                      const isCurrentScore = ranking.score === score && name && ranking.name === name;
                      
                      return (
                        <tr 
                          key={ranking.id || index} 
                          className={`${
                            isCurrentScore 
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500' 
                              : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          } hover:bg-gray-100 transition duration-150`}
                        >
                          <td className="py-3 px-4">
                            {index < 3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                'bg-amber-600 text-amber-50'
                              } font-bold text-xs`}>
                                {index + 1}
                              </span>
                            ) : (
                              <span className="text-gray-600">{index + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={isCurrentScore ? "font-medium text-indigo-700" : ""}>
                              {ranking.name}
                              {isCurrentScore && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">나</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{ranking.score.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600">
                            {new Date(ranking.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
        
        {/* 다시 시작하기 버튼 */}
        <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition duration-300 flex items-center justify-center"
            onClick={handleRestart}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            다시 시작하기
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-lg shadow-md hover:from-gray-700 hover:to-gray-800 transition duration-300 flex items-center justify-center"
            onClick={() => {
              // 결과 공유하기
              const text = `이탈리아어 퀴즈 결과: ${score}점, 정확도 ${accuracy}%, 최대 연속 ${streak}!`;
              if (navigator.share) {
                navigator.share({
                  title: '이탈리아어 퀴즈 결과',
                  text: text,
                  url: window.location.href
                }).catch(err => console.error('공유하기 오류:', err));
              } else {
                // 클립보드에 복사
                navigator.clipboard.writeText(text)
                  .then(() => alert('결과가 클립보드에 복사되었습니다.'))
                  .catch(err => console.error('클립보드 복사 오류:', err));
              }
            }}
          >
            <FaShare className="mr-2" />
            결과 공유하기
          </motion.button>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    // 게임 상태가 'results'로 변경될 때마다 확인
    if (gameState === 'results') {
      console.log("gameState가 results로 변경됨, showRankingForm 값:", showRankingForm);
      // 여기에 직접 설정
      setShowRankingForm(true);
      console.log("useEffect에서 showRankingForm을 true로 설정");
    }
  }, [gameState]);

  // 방문자 수 업데이트 로직
  useEffect(() => {
    const updateVisitorCount = async () => {
      if (visitedRef.current) return; // 이미 방문 처리했으면 중복 방지
      
      try {
        // 방문자 수 문서 참조
        const visitorRef = doc(db, 'stats', 'visitors');
        
        // 방문자 수 데이터 가져오기
        const visitorDoc = await getDoc(visitorRef);
        
        if (visitorDoc.exists()) {
          // 방문자 수 증가
          const currentCount = visitorDoc.data().count || 13000;
          await updateDoc(visitorRef, { count: increment(1) });
          setVisitorCount(currentCount + 1);
        } else {
          // 첫 방문자 (문서 없으면 생성)
          await setDoc(visitorRef, { count: 13001 });
          setVisitorCount(13001);
        }
        
        // 중복 방지를 위한 상태 업데이트
        visitedRef.current = true;
        
        // 로컬 스토리지에 방문 기록 저장 (24시간마다 초기화)
        const now = Date.now();
        const lastVisit = localStorage.getItem('lastVisit');
        
        if (!lastVisit || now - parseInt(lastVisit) > 24 * 60 * 60 * 1000) {
          localStorage.setItem('lastVisit', now.toString());
        }
      } catch (error) {
        console.error('방문자 수 업데이트 오류:', error);
        // 오류 발생 시 기본값 표시
        setVisitorCount(13000);
      }
    };
    
    updateVisitorCount();
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl md:text-4xl font-bold text-center md:text-left text-indigo-800">
          Italian Brainrot Quiz
        </h1>
        
        <div className="flex justify-center md:justify-end mt-3 md:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white px-4 py-2 rounded-full shadow-md flex items-center"
          >
            <FaUsers className="text-indigo-600 mr-2" />
            <div>
              <span className="font-bold text-indigo-700">{visitorCount.toLocaleString('ko-KR')}</span>
              <span className="text-gray-600 text-sm ml-1">명 방문</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 오류 메시지 */}
      {speechRecognitionError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          role="alert"
          aria-live="assertive"
          className="max-w-md mx-auto mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{speechRecognitionError}</span>
          </p>
        </motion.div>
      )}
      
      {/* 오류 메시지 */}
      {loadError}
      
      {/* 인트로 화면 */}
      {gameState === 'intro' && (
        <div className="flex flex-col items-center space-y-8">
          <motion.section 
            className="max-w-md w-full mx-auto text-center bg-white p-8 rounded-xl shadow-lg mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome to Italian Brainrot Quiz!</h2>
            <p className="mb-6 text-gray-600">캐릭터의 이름을 듣고 정확하게 발음해보세요. {processedCharacters.length}개의 캐릭터를 맞출 수 있나요?</p>
            
            <motion.button
              onClick={handleStartGame}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="게임 시작하기"
            >
              게임 시작
            </motion.button>
            
            {/* 구조화된 데이터 - JSON-LD */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'Game',
                  'name': 'Italian Brainrot Quiz',
                  'description': 'Italian Brainrot 캐릭터를 맞추는 재미있는 발음 퀴즈 게임',
                  'url': 'https://italian-brainrot-quiz.vercel.app', // 실제 URL로 변경하세요
                  'applicationCategory': 'Game',
                  'operatingSystem': 'Web',
                  'author': {
                    '@type': 'Person',
                    'name': '이탈리안 브레인롯 퀴즈 개발자'
                  },
                  'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'KRW',
                    'availability': 'https://schema.org/InStock'
                  },
                  'aggregateRating': {
                    '@type': 'AggregateRating',
                    'ratingValue': '4.8',
                    'ratingCount': '100',
                    'bestRating': '5',
                    'worstRating': '1'
                  }
                })
              }}
            />
          </motion.section>
          
          {/* 방명록 섹션 */}
          <section className="max-w-2xl w-full mx-auto mt-4">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">Guestbook</h2>
            <Guestbook />
          </section>
        </div>
      )}
      
      {/* 게임 화면 */}
      {gameState === 'playing' && (
        <motion.div 
          className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 진행 상황 표시줄 */}
          <div className="w-full bg-gray-200 h-2">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* 게임 헤더 */}
          <div className="p-4 flex justify-between items-center bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <FaStar className="text-yellow-500 mr-1" />
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex items-center">
                <FaFire className="text-orange-500 mr-1" />
                <span>{streak}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {[...Array(3)].map((_, i) => (
                <FaHeart 
                  key={i} 
                  className={`mx-0.5 ${i < lives ? 'text-red-500' : 'text-gray-300'}`}
                />
              ))}
            </div>
            
            <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-800 text-sm font-medium">
              {currentCharacterIndex + 1}/{processedCharacters.length}
            </div>
          </div>
          
          {/* 캐릭터 이미지 */}
          {!showResult && (
            <div className="p-6 text-center">
              <div className="relative">
                {processedCharacters.length > 0 && currentCharacterIndex >= 0 && currentCharacterIndex < processedCharacters.length && (
                  <div className="w-40 h-40 mx-auto mb-4 relative rounded-full overflow-hidden border-2 border-indigo-200 shadow-md">
                    <Image
                      src={processedCharacters[currentCharacterIndex]?.imageUrl || '/characters/default.jpg'}
                      alt="캐릭터 이미지"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* 타이머 */}
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  {timeLeft}
                </div>
              </div>
              
              <div className="mt-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">이 캐릭터의 이름은?</h3>
                
                <div className="flex justify-center mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const currentCharacter = processedCharacters[currentCharacterIndex];
                      if (currentCharacter && currentCharacter.name) {
                        playTTS(currentCharacter.name);
                      }
                    }}
                    className="bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg mr-2 flex items-center"
                  >
                    <FaVolumeUp className="mr-2" />
                    다시 듣기
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => showHintForCurrentCharacter()}
                    className="bg-yellow-100 text-yellow-700 py-2 px-4 rounded-lg flex items-center"
                  >
                    <FaLightbulb className="mr-2" />
                    힌트
                  </motion.button>
                </div>
                
                {/* 힌트 표시 */}
                {processedCharacters.length > 0 &&
                 currentCharacterIndex >= 0 && 
                 currentCharacterIndex < processedCharacters.length && 
                 hints[processedCharacters[currentCharacterIndex]?.id] && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm text-yellow-800">
                    <p className="font-medium mb-1">힌트:</p>
                    <p>{processedCharacters[currentCharacterIndex]?.description}</p>
                  </div>
                )}
              </div>
              
              {/* 음성 인식 UI */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleSpeechRecognition}
                  disabled={isProcessing} // 처리 중일 때 중복 클릭 방지
                  className={`w-20 h-20 rounded-full ${
                    isListening 
                      ? 'bg-red-500 active:bg-red-600' 
                      : 'bg-indigo-600 active:bg-indigo-700'
                  } text-white flex items-center justify-center shadow-lg transition-colors mb-3 touch-manipulation`}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitUserSelect: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {isListening ? (
                    <FaMicrophoneSlash className="text-3xl" />
                  ) : (
                    <FaMicrophone className="text-3xl" />
                  )}
                </button>
                
                <p className="text-gray-600 text-sm mb-2">
                  {isListening ? '말하는 중...' : '마이크를 탭하고 이름을 말하세요'}
                </p>
                
                {userInput && (
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800">
                    {userInput}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 결과 화면 */}
          {showResult && (
            <div className="p-6 text-center">
              <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 shadow-md"
                style={{ 
                  borderColor: isCorrect ? '#4CAF50' : '#FF2D55',
                }}
              >
                <Image
                  src={processedCharacters[currentCharacterIndex]?.imageUrl || '/characters/default.jpg'}
                  alt="캐릭터 이미지"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="bg-white mb-6">
                <div className="flex items-center justify-center mb-2">
                  {isCorrect ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500 text-4xl"
                    >
                      <FaCheckCircle />
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-red-500 text-4xl"
                    >
                      <FaTimesCircle />
                    </motion.div>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold mb-1 text-gray-800">
                  {isCorrect ? '정답입니다!' : '틀렸습니다!'}
                </h3>
                
                {lastResult && (
                  <div className="text-center mb-4">
                    <p className="text-lg">
                      <span className="font-medium text-indigo-700">정답: </span>
                      <span>{lastResult.characterName}</span>
                    </p>
                    
                    {!isCorrect && (
                      <p className="text-gray-600">
                        <span className="font-medium">입력: </span>
                        <span>{lastResult.userInput}</span>
                      </p>
                    )}
                    
                    {isCorrect && lastResult.pointsEarned > 0 && (
                      <div className="mt-2">
                        <p className="text-green-600 font-bold text-xl">+{lastResult.pointsEarned} 점</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>기본 점수: 100점</p>
                          {lastResult.timeBonus > 0 && (
                            <p>시간 보너스: +{lastResult.timeBonus}점</p>
                          )}
                          {lastResult.streakBonus > 0 && (
                            <p>연속 보너스: +{lastResult.streakBonus}점</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center mx-auto"
              >
                다음 문제
                <FaStepForward className="ml-2" />
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* 결과 화면 */}
      {gameState === 'results' && renderResults()}
    </main>
  );
}
