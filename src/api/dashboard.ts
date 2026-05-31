import client from './client';

interface DashboardResponse {
  name: string;
  level: string;
  content_days: string;
  content_percent: string;
  clear_story: string;
  content_phrase: string;
  weekly_done: boolean[];
}

export const getDashboard = async (): Promise<DashboardResponse> => {
  const res = await client.post('/dash');
  return res.data;
};