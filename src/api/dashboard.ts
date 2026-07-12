import client from './client';

export interface DashboardResponse {
  name: string;
  levelCode: number;
  levelDesc: string;
  consecutiveDays: number;
  progressRate: number;
  completedStoryCount: number;
  commentText: string;
  weeklyStudy: boolean[];
  currentPoints: number;
  incorrectQuizCount: number;
}

export const getDashboard = async (): Promise<DashboardResponse> => {
  const res = await client.post('/api/v1/dash');
  return res.data;
};