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

### 단계 2: API 키 및 환경 변수 설정
`openclaude_chan`이 Anthropic API와 통신하기 위해 `ANTHROPIC_API_KEY` 설정이 필요합니다. 맥미니 터미널에서 다음 중 한 가지 방법을 선택하여 설정합니다.

**방법 A: .env 파일 생성 (권장)**
```bash
cd ~/projects/openclaude_chan
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
```

**방법 B: zsh 프로필에 영구 등록**
```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### 단계 3: OpenClaude gRPC 서버 실행
Claude API와 통신하는 백엔드 서버를 먼저 실행합니다.
```bash
cd ~/projects/openclaude_chan
bun dev:grpc
```
*(성공 시: `gRPC Server running at localhost:50051` 메시지 출력)*

### 단계 4: OpenClaw 게이트웨이 실행
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
*   **gRPC 연결 오류:** OpenClaw가 `localhost:50051`에 접속할 수 없는 경우, `openclaw.plugin.json` 또는 `config.json`에서 `grpcHost`와 `grpcPort` 설정을 확인하십시오.

---

## 부록: 로컬 모델 (Ollama/Gemma 등) 사용 방법

Anthropic의 Claude API 대신 로컬의 Ollama 모델을 사용하고 싶은 경우, **단계 3**에서 서버를 실행할 때 다음과 같이 환경 변수를 추가하여 실행하십시오.

```bash
cd ~/projects/openclaude_chan

# Ollama의 Gemma 모델을 사용하는 예시
CLAUDE_CODE_USE_OPENAI=1 \
OPENAI_BASE_URL=http://localhost:11434/v1 \
OPENAI_MODEL=gemma2:9b \
OPENAI_API_KEY=ollama \
bun dev:grpc
```

*   `OPENAI_MODEL`: `ollama list` 명령어로 확인한 모델명을 입력하십시오.
*   이 설정을 사용하면 OpenClaw(텔레그램)로부터 들어온 요청이 맥미니 로컬에서 돌아가는 Gemma 모델에 의해 처리됩니다.

