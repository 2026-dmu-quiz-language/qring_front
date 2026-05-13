// 하단 탭 네비게이터 파라미터
export type BottomTabParamList = {
  LearnTab: undefined;
  HomeTab: undefined;
  MyPageTab: undefined;
};

// 학습 탭 내부 스택 파라미터
export type LearnStackParamList = {
  StoryHome: undefined;
  ChatLearn: {
    episodeId: number;
    episodeTitle: string;
  };
  LearningResult: undefined;
};