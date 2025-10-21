# GCP Preview 배포 설정 가이드

이 프로젝트는 PR마다 Google Cloud Run에 자동으로 Preview를 배포합니다.

## 사전 준비사항

### 1. GCP 프로젝트 및 서비스 활성화

```bash
# 프로젝트 ID 설정
export PROJECT_ID="your-gcp-project-id"

# 필요한 API 활성화
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  --project=${PROJECT_ID}
```

### 2. Artifact Registry 저장소 생성

```bash
gcloud artifacts repositories create dashboard \
  --repository-format=docker \
  --location=asia-northeast3 \
  --project=${PROJECT_ID}
```

### 3. Service Account 생성 및 권한 부여

```bash
# Service Account 생성
gcloud iam service-accounts create github-actions-dashboard \
  --display-name="GitHub Actions for Dashboard" \
  --project=${PROJECT_ID}

# 필요한 역할 부여
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-dashboard@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-dashboard@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-dashboard@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 4. Workload Identity Federation 설정

```bash
# Workload Identity Pool 생성
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --project=${PROJECT_ID}

# Workload Identity Provider 생성
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_ORG_OR_USERNAME'" \
  --project=${PROJECT_ID}

# Service Account에 Workload Identity 사용 권한 부여
export REPO="YOUR_GITHUB_ORG/YOUR_REPO_NAME"

gcloud iam service-accounts add-iam-policy-binding \
  github-actions-dashboard@${PROJECT_ID}.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}" \
  --project=${PROJECT_ID}
```

### 5. Workload Identity Provider 전체 이름 가져오기

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --format='value(name)' \
  --project=${PROJECT_ID}
```

출력 예시:
```
projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

## GitHub Secrets 설정

Repository → Settings → Secrets and variables → Actions에서 다음 secrets를 추가:

1. **GCP_PROJECT_ID**
   - GCP 프로젝트 ID
   - 예: `my-project-123456`

2. **GCP_SA_EMAIL**
   - Service Account 이메일
   - 예: `github-actions-dashboard@my-project-123456.iam.gserviceaccount.com`

3. **WORKLOAD_IDENTITY_PROVIDER**
   - 위에서 가져온 Workload Identity Provider 전체 경로
   - 예: `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

## 동작 방식

### PR 생성/업데이트 시
1. Next.js 애플리케이션 빌드
2. Docker 이미지 생성 및 Artifact Registry에 푸시
3. Cloud Run에 PR별 서비스 배포 (`dashboard-pr-{PR번호}`)
4. PR에 Preview URL 코멘트 추가

### PR 닫힐 때
1. Cloud Run 서비스 삭제
2. Artifact Registry의 이미지 삭제

## 비용 최적화

- Cloud Run은 요청이 있을 때만 과금
- 각 PR 서비스는 최대 2개 인스턴스로 제한
- PR 종료 시 자동으로 리소스 정리
- 메모리: 512Mi, CPU: 1 (조정 가능)

## 로컬 Docker 테스트

```bash
# 이미지 빌드
docker build -t dashboard-local .

# 컨테이너 실행
docker run -p 3000:3000 dashboard-local

# 브라우저에서 http://localhost:3000 접속
```

## 트러블슈팅

### 권한 오류
- Service Account 권한 확인
- Workload Identity Federation 설정 확인
- GitHub Actions에서 `id-token: write` 권한 확인

### 이미지 푸시 실패
- Artifact Registry API 활성화 확인
- 저장소 존재 여부 확인

### 배포 실패
- Cloud Run API 활성화 확인
- 리전 설정 확인 (기본: asia-northeast3)
- 서비스 이름 중복 확인

## 추가 설정

### 환경 변수 추가
`.github/workflows/preview-gcp.yml`의 `--set-env-vars`에 추가:

```yaml
--set-env-vars="NODE_ENV=production,DATABASE_URL=xxx,NEXTAUTH_SECRET=xxx"
```

### 메모리/CPU 조정
```yaml
--memory=1Gi \
--cpu=2 \
```

### Cloud SQL 연결
```yaml
--add-cloudsql-instances=PROJECT:REGION:INSTANCE
```

## 참고 자료

- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)
