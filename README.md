# inZOI Concept Studio

inZOI 가구 에셋 컨셉시트 자동 생성 도구

## 파일 구조
```
inzoi-concept-studio/
├── inzoi-concept-tool.jsx   ← 메인 앱 (React)
└── README.md                ← 이 파일
```

## 사용 방법
1. Claude 아티팩트에서 `inzoi-concept-tool.jsx`를 열어 바로 사용
2. 또는 React 프로젝트에 컴포넌트로 임포트

## 기능
- inZOI 카탈로그 기준 45개 가구 카테고리 (방별 그룹)
- 8종 스타일 프리셋
- Claude API 프롬프트 자동 최적화
- 8개 시안 생성
- 팀 투표 시스템 (복수 선택, 동점 처리)
- 컨셉시트 자동 합성 (2400x3200px PNG)
- 메타데이터 JSON 다운로드

## 배포

### Cloudflare Pages 자동 배포 설정 (GitHub 연동)

GitHub에 푸시하면 자동으로 빌드 및 배포되도록 설정하는 방법입니다.

#### 1. Cloudflare Dashboard에서 연동

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속 → **Workers & Pages** → **Pages**
2. **inzoi-concept-studio** 프로젝트 클릭 (또는 신규 프로젝트라면 **Create a project** → **Connect to Git**)
3. **Settings** 탭 → **Builds & deployments** 섹션으로 이동
4. **Git repository** 항목에서 **Connect** 클릭
5. GitHub 계정 연동 후 `zpens/inzoi-concept-studio` 리포지토리 선택

#### 2. 빌드 설정

| 항목 | 값 |
|------|-----|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 18 (또는 Environment variable로 `NODE_VERSION` = `18` 설정) |

#### 3. 저장 및 확인

설정 저장 후 GitHub `main` 브랜치에 푸시하면 자동으로:
1. Cloudflare가 변경 감지
2. `npm install` → `npm run build` 실행
3. `dist/` 폴더를 배포
4. https://inzoi-concept-studio.pages.dev 에 반영

#### 수동 배포 (CLI)

자동 배포 설정 전이나 긴급 배포 시:

```bash
npm run build
npx wrangler pages deploy dist --project-name=inzoi-concept-studio
```
