import { create } from 'zustand';
import { Character, getRandomCharacters } from '@/data/characters';

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
}

interface GameState {
  characters: Character[];
  currentCharacterIndex: number | null;
  isPlaying: boolean;
  quizResults: QuizResult[];
  isLoading: boolean;
  error: string | null;
  startGame: () => void;
  endGame: () => void;
  nextCharacter: () => void;
  addQuizResult: (result: QuizResult) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  characters: [],
  currentCharacterIndex: null,
  isPlaying: false,
  quizResults: [],
  isLoading: false,
  error: null,
  
  startGame: () => {
    try {
      // 랜덤하게 5개의 캐릭터를 선택
      const selectedCharacters = getRandomCharacters(5);
      
      set({
        characters: selectedCharacters,
        currentCharacterIndex: 0,
        isPlaying: true,
        quizResults: [],
        isLoading: false,
        error: null
      });
      
      console.log('게임 시작됨, 캐릭터 수:', selectedCharacters.length);
    } catch (error) {
      console.error('게임 시작 중 오류:', error);
      set({ error: '게임을 시작하는 중 오류가 발생했습니다.' });
    }
  },
  
  endGame: () => {
    set({
      isPlaying: false,
      currentCharacterIndex: null
    });
    console.log('게임 종료됨');
  },
  
  nextCharacter: () => {
    const { currentCharacterIndex, characters } = get();
    
    if (currentCharacterIndex === null) return;
    
    // 다음 캐릭터 인덱스 계산
    const nextIndex = currentCharacterIndex + 1;
    
    // 모든 캐릭터를 다 돌았는지 확인
    if (nextIndex >= characters.length) {
      set({ isPlaying: false, currentCharacterIndex: null });
      console.log('모든 캐릭터 완료');
    } else {
      set({ currentCharacterIndex: nextIndex });
      console.log('다음 캐릭터로 이동:', nextIndex);
    }
  },
  
  addQuizResult: (result: QuizResult) => {
    set(state => ({
      quizResults: [...state.quizResults, result]
    }));
    console.log('퀴즈 결과 추가됨:', result);
  }
})); 