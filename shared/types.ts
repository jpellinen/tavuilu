export interface Word {
  id: string;
  word: string;
  syllables: string[];
  difficulty: 1 | 2 | 3;
  imageRef: string;
  tags: string[];
}

export interface UserProgress {
  xp: number;
  level: number;
  completedWordIds: string[];
}

export interface Locale {
  startGame: string;
  settings: string;
  checkAnswer: string;
  correct: string;
  tryAgain: string;
  difficulty: string;
  language: string;
}
