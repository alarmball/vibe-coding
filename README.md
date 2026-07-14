# 카페 매출 관리

Firestore 실시간 동기화를 사용하는 단일 페이지 카페 매출 관리 프로그램입니다.

## 기능

- 메뉴명, 가격, 할인율 등록 및 삭제
- 메뉴와 수량을 선택해 주문 등록
- 주문 건수, 판매 수량, 누적 매출 자동 집계
- 메뉴와 매출 내역 실시간 동기화
- 반응형 데스크톱/모바일 화면

## Firestore 컬렉션

- `cafeMenus`: `name`, `price`, `discount`, `createdAt`
- `cafeSales`: `menuId`, `menu`, `originalPrice`, `discount`, `price`, `quantity`, `total`, `createdAt`

## 실행 및 배포

정적 서버로 `index.html`을 실행합니다. Firebase CLI가 설치되어 있다면 다음 명령으로 보안 규칙과 Hosting을 배포할 수 있습니다.

```bash
firebase login
firebase use vibe-coding-88fba
firebase deploy --only firestore:rules,hosting
```

현재 규칙은 로그인 기능이 없는 데모 앱에 맞춰 읽기/생성/삭제를 공개합니다. 실제 운영 환경에서는 Firebase Authentication을 추가하고 관리자 계정만 쓰기가 가능하도록 규칙을 제한해야 합니다.
