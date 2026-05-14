# 📝 큐링(Qring) Git Convention Guide

원활한 협업과 프로젝트 관리를 위해 큐링 프론트엔드 및 백엔드 레포지토리에서 공통으로 사용하는 Git 컨벤션 가이드입니다.

---

## 💬 Commit Message Convention (커밋 메시지 규칙)

커밋 메시지는 작업 내용을 명확하게 파악할 수 있도록 작성합니다.

> **Format:** `[type]: [subject]`

### ✨ Type (커밋 종류)
| 타입 | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `design` | CSS 및 UI 디자인 변경 |
| `refactor` | 코드 리팩토링 (기능 변경 없음) |
| `style` | 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우 |
| `docs` | 문서 수정 (README.md 등) |
| `test` | 테스트 코드 추가 및 수정 |
| `chore` | 빌드 업무, 패키지 매니저 수정 (.gitignore 등) |

### 💡 Commit Message Example
```bash
feat: 스토리 퀴즈 UI 컴포넌트 추가
fix: 토큰 만료 시 재발급 로직 오류 수정
design: 채팅 화면 버튼 색상 변경
