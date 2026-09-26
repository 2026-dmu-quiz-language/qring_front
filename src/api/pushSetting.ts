import api from './axiosInstance';

export interface PushSettingResponse {
  email: string;
  nickname: string;
  language: string;
  pushEnabled: boolean;
}

// 2-1. 푸시 알림 설정 조회 (POST /api/v1/mypage/setting)
export const getPushSetting = async (): Promise<PushSettingResponse> => {
  const response = await api.post<PushSettingResponse>('/api/v1/mypage/setting');
  return response.data;
};

// 2-2. 푸시 알림 설정 변경 (POST /api/v1/update)
export const updatePushSetting = async (pushEnabled: boolean): Promise<void> => {
  await api.post('/api/v1/update', { pushEnabled });
};