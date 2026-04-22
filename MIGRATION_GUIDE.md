# OpenClaw + OpenClaude 통합 및 Mac Mini 배포 가이드

본 문서는 `D:\CODE\openclaw_openclaude`에서 작업한 OpenClaude 통합 기능을 GitHub를 통해 Mac Mini로 배포하고 실행하는 상세 과정을 안내합니다.

## 1. 개요
* **OpenClaw (게이트웨이):** `openclaw_openclaude` 프로젝트. 텔레그램 채널과 연동되어 사용자 입력을 받고, 내부 `openclaude` Provider를 통해 로컬 gRPC 서버로 전달합니다.
* **OpenClaude (API 서버):** `openclaude_chan` 프로젝트. Anthropic Claude API와 통신하며, gRPC 서버(`bun dev:grpc`)를 통해 OpenClaw와 통신합니다.

---

## 2. GitHub를 통한 소스 코드 동기화

작업용 PC에서 수정된 코드를 GitHub 레포지토리에 푸시합니다.

### 2-1. `openclaude_chan` 푸시
```bash
cd D:\CODE\openclaude_chan
git add .
git commit -m "feat: gRPC 서버 기능 활성화 및 의존성 설치"
git push origin main
```

### 2-2. `openclaw_openclaude` 푸시
```bash
cd D:\CODE\openclaw_openclaude
git add .
git commit -m "feat: openclaude gRPC provider 확장 추가 및 pnpm 설정 수정"
git push origin main
```

---

## 3. Mac Mini에서 환경 설정 및 실행

### 단계 1: 소스 코드 다운로드
Mac Mini 터미널에서 프로젝트 폴더(예: `~/projects`)로 이동합니다.

1. **`openclaude_chan` 클론/업데이트:**
   ```bash
   cd ~/projects
   git clone <openclaude_chan_REPO_URL>
   cd openclaude_chan
   pnpm install
   ```

2. **`openclaw_openclaude` 클론/업데이트:**
   ```bash
   cd ~/projects
   git clone <openclaw_openclaude_REPO_URL>
   cd openclaw_openclaude
   pnpm install
   pnpm build
   ```

### 단계 2: OpenClaude gRPC 서버 실행
Claude API와 통신하는 백엔드 서버를 먼저 실행합니다.
```bash
cd ~/projects/openclaude_chan
# 환경 변수에 ANTHROPIC_API_KEY가 설정되어 있어야 합니다.
bun dev:grpc
```
*(성공 시: `gRPC Server running at localhost:50051` 메시지 출력)*

### 단계 3: OpenClaw 게이트웨이 실행
텔레그램 봇과 연결된 게이트웨이를 실행합니다.

1. **설정 확인:** `~/.openclaw/config/config.json` 파일을 열어 `provider`를 `openclaude`로, `model`을 `openclaude/agent`로 설정합니다.
   ```json
   {
     "models": {
       "default": "openclaude/agent"
     }
   }
   ```
2. **실행:**
   ```bash
   cd ~/projects/openclaw_openclaude
   pnpm dev
   ```

---

## 4. 검증 및 테스트
1. 텔레그램 봇에게 메시지를 보냅니다.
2. `openclaw_openclaude` 로그에서 메시지 수신을 확인합니다.
3. `openclaude_chan` 로그에서 Claude API 호출 및 gRPC 응답 전송을 확인합니다.
4. 텔레그램으로 Claude의 답변이 돌아오는지 확인합니다.

## 5. 트러블슈팅 (Troubleshooting)
* **pnpm install 오류:** 패키지 릴리즈 날짜 제한(`minimumReleaseAge`) 오류가 발생하면 `pnpm-workspace.yaml`의 `minimumReleaseAgeExclude` 목록에 해당 패키지를 추가하십시오. (현재 `tokenjuice`가 추가되어 있습니다.)
* **gRPC 연결 오류:** OpenClaw가 `localhost:50051`에 접속할 수 없는 경우, `openclaw.plugin.json` 또는 `config.json`에서 `grpcHost`와 `grpcPort` 설정을 확인하십시오.
