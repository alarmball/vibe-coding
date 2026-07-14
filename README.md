# Run Bolt 러닝 커뮤니티

Vite + React + TypeScript와 Firebase Firestore로 만든 러닝 기록 커뮤니티입니다.

## 실행

1. `src/firebase.ts`의 `YOUR_*` 값을 Firebase Console의 웹 앱 설정값으로 교체합니다.
2. Firebase Authentication에서 Google 로그인을 활성화합니다.
3. Firestore 보안 규칙을 배포합니다.

```bash
npm install
npm run dev
firebase deploy --only firestore:rules
```

## Firestore 구조

```text
run_bolt/{recordId}
  date, distance, duration, memo
  authorId, authorName, authorPhoto, createdAt

run_bolt/{recordId}/sparks/{uid}
  uid, createdAt

run_bolt/{recordId}/comments/{commentId}
  text, authorId, authorName, createdAt
```
