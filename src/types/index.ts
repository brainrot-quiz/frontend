export interface Character {
  id: string;
  name: string;
  image: string;
  description: string;
  likes: number;
  fortune: string;
  personality: string;
}

export interface QuizResult {
  characterId: string;
  time: number;
  correct: boolean;
  date: string;
  pointsEarned?: number;
  timeBonus?: number;
  streakBonus?: number;
  similarity?: number;
}

export interface GameState {
  characters: Character[];
  currentCharacterIndex: number;
  quizResults: QuizResult[];
  isPlaying: boolean;
  startTime: number | null;
  dailyCharacter: Character | null;
}

export interface ShareData {
  type: 'quiz' | 'fortune';
  data: QuizResult[] | Character;
  date: string;
} 