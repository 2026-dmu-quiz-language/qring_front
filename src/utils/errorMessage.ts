export const getErrorMessage = (err: any): string => {
  const status = err?.response?.status;
  const code = err?.code;

  if (code === 'ECONNABORTED') return '서버 응답 시간 초과 (timeout)';
  if (code === 'ERR_NETWORK' || !status) return '서버에 연결할 수 없음 (네트워크 오류 또는 서버 꺼짐)';
  if (status === 404) return 'API 경로를 찾을 수 없음 (404)';
  if (status === 401 || status === 403) return `인증 오류 (${status}) — 토큰 확인 필요`;
  if (status >= 500) return `서버 내부 오류 (${status})`;
  return `알 수 없는 오류 (${status || code})`;
};
