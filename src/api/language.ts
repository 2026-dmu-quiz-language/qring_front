import client from './client';

export const switchLanguage = async (language: string): Promise<void> => {
  await client.post('/switch', { language });
};
