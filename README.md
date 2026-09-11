# 학교 업무 IPA

학교 관리자가 업무 목록과 설문 회차를 만들고, 교직원이 익명 참여코드로 중요도·수행도를 평가하는 운영용 웹앱입니다.

## 주요 기능

- PDF·Excel 업무분장 문서의 로컬 규칙 기반 업무 추출
- 회차별 문항 스냅샷과 시작·마감 관리
- 원문을 저장하지 않는 응답자별 익명 참여코드
- 마감 전 응답 수정, 미사용 코드 폐기
- 중요도·수행도 IPA 산점도와 포인트 툴팁
- 결과 Excel 다운로드와 인쇄/PDF 출력
- 회차 보관 및 개인정보 보존 기간 종료 후 영구 삭제

## 로컬 실행

Node.js 22를 사용합니다. `.env.example`을 `.env.local`로 복사하고 값을 설정합니다.

```bash
npm ci
npm run dev
```

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL_ALLOWLIST`
- `APP_URL`

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다. 브라우저 코드, 로그, 저장소에 노출하지 마세요.

## 데이터베이스

staging에서 먼저 검증한 뒤 운영 프로젝트에 마이그레이션을 적용합니다.

```bash
npx supabase db push --dry-run
npx supabase db push
```

## 품질 점검

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

상세 배포 순서, 개인정보 보존, 장애 대응, 11월 실행 체크포인트는 [`docs/operations.md`](docs/operations.md)를 참고하세요.
