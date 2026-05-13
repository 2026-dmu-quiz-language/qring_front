// 콘텐츠 관련 타입

export interface Category {
  id: string;
  label: string;
  emoji: string;
}

export interface Episode {
  id: number;
  title: string;
  quizCount: number;
  rating: number;
  bgColor: string;
}
