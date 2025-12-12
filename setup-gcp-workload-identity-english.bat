@echo off
REM GCP Workload Identity Federation Setup Batch Script for dashboard-479400
REM GitHub Repository: lilyth-y/dashboard

setlocal enabledelayedexpansion

echo ============================================================
echo GCP Workload Identity Federation Setup Starting
echo ============================================================
echo Project ID: dashboard-479400
echo GitHub Repository: lilyth-y/dashboard
echo ============================================================

REM Variable settings
set GCP_PROJECT_ID=dashboard-479400
set GITHUB_ORG=lilyth-y
set GITHUB_REPO=dashboard
set POOL_NAME=github-pool
set PROVIDER_NAME=github-provider
set SERVICE_ACCOUNT_NAME=github-actions-dashboard

REM Check if gcloud is installed
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] gcloud CLI is not installed.
    pause
    exit /b 1
)

echo [INFO] gcloud CLI verification complete

REM Set GCP project
echo [INFO] Setting GCP project...
gcloud config set project %GCP_PROJECT_ID%

REM Enable required APIs
echo [INFO] Enabling required GCP APIs...
gcloud services enable ^
  run.googleapis.com ^
  artifactregistry.googleapis.com ^
  cloudbuild.googleapis.com ^
  iamcredentials.googleapis.com ^
  --project=%GCP_PROJECT_ID%

REM Create Workload Identity Pool
echo [INFO] Checking if Workload Identity Pool exists...
gcloud iam workload-identity-pools describe %POOL_NAME% ^
  --location=global ^
  --project=%GCP_PROJECT_ID% >nul 2>&1

if %errorlevel% equ 0 (
    echo [WARN] Workload Identity Pool '%POOL_NAME%' already exists. Skipping.
) else (
    echo [INFO] Creating Workload Identity Pool...
    gcloud iam workload-identity-pools create %POOL_NAME% ^
      --project=%GCP_PROJECT_ID% ^
      --location=global ^
      --display-name="GitHub Actions Pool"
    echo [INFO] Workload Identity Pool created successfully
)

REM Create OIDC Provider
echo [INFO] Checking if OIDC Provider exists...
gcloud iam workload-identity-pools providers describe %PROVIDER_NAME% ^
  --location=global ^
  --workload-identity-pool=%POOL_NAME% ^
  --project=%GCP_PROJECT_ID% >nul 2>&1

if %errorlevel% equ 0 (
    echo [WARN] OIDC Provider '%PROVIDER_NAME%' already exists. Skipping.
) else (
    echo [INFO] Creating OIDC Provider...
    gcloud iam workload-identity-pools providers create-oidc %PROVIDER_NAME% ^
      --project=%GCP_PROJECT_ID% ^
      --location=global ^
      --workload-identity-pool=%POOL_NAME% ^
      --display-name="GitHub Actions Provider" ^
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" ^
      --attribute-condition="assertion.repository_owner == '%GITHUB_ORG%'" ^
      --issuer-uri="https://token.actions.githubusercontent.com"
    echo [INFO] OIDC Provider created successfully
)

REM Get WORKLOAD_IDENTITY_PROVIDER value
echo [INFO] Retrieving WORKLOAD_IDENTITY_PROVIDER value...
for /f "delims=" %%i in ('gcloud iam workload-identity-pools providers describe %PROVIDER_NAME% ^
  --project=%GCP_PROJECT_ID% ^
  --location=global ^
  --workload-identity-pool=%POOL_NAME% ^
  --format="value(name)"') do set WORKLOAD_IDENTITY_PROVIDER=%%i

echo [INFO] WORKLOAD_IDENTITY_PROVIDER: %WORKLOAD_IDENTITY_PROVIDER%

REM Create Service Account
echo [INFO] Checking if Service Account exists...
gcloud iam service-accounts describe %SERVICE_ACCOUNT_NAME%@%GCP_PROJECT_ID%.iam.gserviceaccount.com ^
  --project=%GCP_PROJECT_ID% >nul 2>&1

if %errorlevel% equ 0 (
    echo [WARN] Service Account '%SERVICE_ACCOUNT_NAME%' already exists. Skipping.
) else (
    echo [INFO] Creating Service Account...
    gcloud iam service-accounts create %SERVICE_ACCOUNT_NAME% ^
      --display-name="GitHub Actions for Dashboard" ^
      --project=%GCP_PROJECT_ID%
    echo [INFO] Service Account created successfully
)

set SERVICE_ACCOUNT_EMAIL=%SERVICE_ACCOUNT_NAME%@%GCP_PROJECT_ID%.iam.gserviceaccount.com
echo [INFO] Service Account Email: %SERVICE_ACCOUNT_EMAIL%

REM Grant Cloud Run permissions
echo [INFO] Granting Cloud Run permissions...
gcloud projects add-iam-policy-binding %GCP_PROJECT_ID% ^
  --member="serviceAccount:%SERVICE_ACCOUNT_EMAIL%" ^
  --role="roles/run.admin"

REM Grant Artifact Registry permissions
echo [INFO] Granting Artifact Registry permissions...
gcloud projects add-iam-policy-binding %GCP_PROJECT_ID% ^
  --member="serviceAccount:%SERVICE_ACCOUNT_EMAIL%" ^
  --role="roles/artifactregistry.writer"

REM Grant Service Account User permissions
echo [INFO] Granting Service Account User permissions...
gcloud projects add-iam-policy-binding %GCP_PROJECT_ID% ^
  --member="serviceAccount:%SERVICE_ACCOUNT_EMAIL%" ^
  --role="roles/iam.serviceAccountUser"

REM Grant Workload Identity permissions
echo [INFO] Granting Workload Identity permissions...
set REPO_PATH=%GITHUB_ORG%/%GITHUB_REPO%
gcloud iam service-accounts add-iam-policy-binding %SERVICE_ACCOUNT_EMAIL% ^
  --role="roles/iam.workloadIdentityUser" ^
  --member="principalSet://iam.googleapis.com/projects/%GCP_PROJECT_ID%/locations/global/workloadIdentityPools/%POOL_NAME%/attribute.repository/%REPO_PATH%" ^
  --project=%GCP_PROJECT_ID%

echo.
echo ============================================================
echo [SUCCESS] GCP Workload Identity Federation Setup Complete!
echo ============================================================
echo.
echo Please register the following values as GitHub Secrets:
echo.
echo GCP_PROJECT_ID=%GCP_PROJECT_ID%
echo GCP_SA_EMAIL=%SERVICE_ACCOUNT_EMAIL%
echo WORKLOAD_IDENTITY_PROVIDER=%WORKLOAD_IDENTITY_PROVIDER%
echo.
echo ============================================================
echo GitHub Repository --^> Settings --^> Secrets and variables --^> Actions
echo ============================================================
echo.

REM Create Artifact Registry repository (optional)
echo [INFO] Creating Artifact Registry repository... (skip if already exists)
gcloud artifacts repositories describe dashboard ^
  --location=asia-northeast3 ^
  --project=%GCP_PROJECT_ID% >nul 2>&1

if %errorlevel% equ 0 (
    echo [WARN] Artifact Registry repository 'dashboard' already exists.
) else (
    gcloud artifacts repositories create dashboard ^
      --repository-format=docker ^
      --location=asia-northeast3 ^
      --project=%GCP_PROJECT_ID%
    echo [INFO] Artifact Registry repository created successfully
)

echo [SUCCESS] All setup completed successfully!
echo.
pause
