# 🍴 식대 관리 - Meal Budget Tracker

사내 식대 잔액을 쉽게 관리하는 Progressive Web App (PWA)

## 📱 주요 기능

- ✅ **원터치 차감**: 점심(7,000원), 커피 L(1,500원), 커피 S(990원) 버튼으로 빠른 차감
- ✅ **직접 입력**: 프리셋 외의 금액도 자유롭게 입력 가능
- ✅ **잔액 충전**: 간편한 충전 기능
- ✅ **되돌리기**: 실수로 차감한 내역을 5초 이내 되돌리기 가능
- ✅ **임계값 알림**: 잔액이 7,000원 미만일 때 시각적 경고
- ✅ **히스토리**: 최근 20개 거래 내역 확인
- ✅ **데이터 보존**: LocalStorage를 활용한 영구 저장
- ✅ **PWA 지원**: 홈 화면에 추가하여 네이티브 앱처럼 사용 가능
- ✅ **모바일 최적화**: 반응형 디자인 & 터치 친화적 UI

## 🚀 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 부드러운 애니메이션
- **Vite** - 빠른 빌드 도구
- **PWA** - 오프라인 지원 & 설치 가능

## 💻 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/YOUR_USERNAME/meal-budget-tracker.git
cd meal-budget-tracker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 5. 프로덕션 미리보기

```bash
npm run preview
```

## 📦 GitHub Pages 배포

### 방법 1: GitHub Actions 자동 배포 (추천)

1. GitHub 저장소 설정
   - Settings > Pages > Source를 "GitHub Actions"로 설정

2. `.github/workflows/deploy.yml` 파일이 자동으로 배포 처리

3. 코드 푸시 시 자동 배포
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 방법 2: 수동 배포

```bash
npm run deploy
```

배포 후 `https://YOUR_USERNAME.github.io/meal-budget-tracker/` 에서 확인 가능

## 📱 PWA로 설치하기

### 모바일 (iOS/Android)
1. 브라우저에서 앱 열기
2. Safari: 공유 버튼 > "홈 화면에 추가"
3. Chrome: 메뉴 > "홈 화면에 추가"

### 데스크톱 (Chrome/Edge)
1. 주소창 오른쪽의 설치 아이콘(+) 클릭
2. "설치" 버튼 클릭

## 🎨 커스터마이징

### 프리셋 버튼 수정

`src/App.tsx` 파일의 `presets` 배열을 수정:

```typescript
const [presets] = useState<Preset[]>([
  { id: 'lunch', label: '점심', amount: 7000, emoji: '🍱' },
  { id: 'coffee-l', label: '커피 L', amount: 1500, emoji: '☕' },
  { id: 'coffee-s', label: '커피 S', amount: 990, emoji: '🥤' },
  // 새로운 프리셋 추가
  { id: 'snack', label: '간식', amount: 2000, emoji: '🍪' },
]);
```

### 임계값 변경

`src/App.tsx`에서 `7000` 값을 원하는 금액으로 변경:

```typescript
{balance < 7000 && (  // 여기를 수정
  <motion.div ...>
    점심 1회 결제가 어려운 금액입니다
  </motion.div>
)}
```

## 📂 프로젝트 구조

```
meal-budget-tracker/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── icon-192.png        # 앱 아이콘
│   └── icon-512.png        # 앱 아이콘
├── src/
│   ├── App.tsx             # 메인 컴포넌트
│   ├── main.tsx            # 진입점
│   └── index.css           # 전역 스타일
├── index.html              # HTML 템플릿
├── vite.config.ts          # Vite 설정 (PWA 포함)
├── tailwind.config.js      # Tailwind CSS 설정
└── package.json            # 프로젝트 설정
```

## 🔧 트러블슈팅

### 데이터가 저장되지 않아요
- LocalStorage가 활성화되어 있는지 확인
- 시크릿 모드가 아닌지 확인
- 브라우저 설정에서 쿠키/저장소가 차단되지 않았는지 확인

### PWA 설치가 안 돼요
- HTTPS 환경에서만 설치 가능 (localhost 제외)
- `manifest.json`과 아이콘 파일이 정상적으로 로드되는지 확인
- Chrome DevTools > Application > Manifest 확인

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

---

Made with ❤️ for better meal budget management