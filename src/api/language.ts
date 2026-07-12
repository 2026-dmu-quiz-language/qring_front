import client from './client';

export const switchLanguage = async (language: string): Promise<void> => {
  await client.post('api/v1/switch', { language });
};

export const checkLanguage = async (lang: string): Promise<boolean> => {
  const res = await client.post('api/v1/langcheck', null, { params: { lang } });
  return res.data;
};
