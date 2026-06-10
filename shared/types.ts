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
  tagline: string;
  home: string;
  game: string;
  loadingWords: string;
  errorLoadingWords: string;
  languageFi: string;
  languageEn: string;
  slotLabel: string;
  login: string;
  register: string;
  name: string;
  email: string;
  password: string;
  logOut: string;
  loggedInAs: string;
  loginError: string;
  registerError: string;
  alreadyHaveAccount: string;
  noAccountYet: string;
  createAccount: string;
}
