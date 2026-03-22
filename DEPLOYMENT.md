# Deployment Guide — Personal Website

**GCP Project:** `personal-website-490704`
**Region:** `asia-southeast1`

## Architecture

```
Firebase Hosting (Frontend SSG)  ←→  Cloud Run (Backend API)  ←→  Cloud Firestore
```

- **Frontend**: Next.js with `output: 'export'` — builds to static HTML at CI time, served by Firebase Hosting
- **Backend**: Express.js in Docker — deployed to Cloud Run via Artifact Registry
- **Database**: Cloud Firestore (already configured)

---

## Prerequisites

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Install Firebase CLI
npm install -g firebase-tools

# Login
gcloud auth login
gcloud config set project personal-website-490704

firebase login
```

---

## One-Time GCP Setup

### 1. Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  --project personal-website-490704
```

### 2. Create Artifact Registry repository

```bash
gcloud artifacts repositories create personal-website \
  --repository-format=docker \
  --location=asia-southeast1 \
  --project=personal-website-490704
```

### 3. Create a Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions SA" \
  --project=personal-website-490704

# Grant required roles
gcloud projects add-iam-policy-binding personal-website-490704 \
  --member="serviceAccount:github-actions-sa@personal-website-490704.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding personal-website-490704 \
  --member="serviceAccount:github-actions-sa@personal-website-490704.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding personal-website-490704 \
  --member="serviceAccount:github-actions-sa@personal-website-490704.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding personal-website-490704 \
  --member="serviceAccount:github-actions-sa@personal-website-490704.iam.gserviceaccount.com" \
  --role="roles/firebasehosting.admin"

# Download the JSON key (used as GCP_SA_KEY secret in GitHub)
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=github-actions-sa@personal-website-490704.iam.gserviceaccount.com
```

> **Important:** Keep `gcp-sa-key.json` secret. Do not commit it to Git.

### 4. Grant Cloud Run access to Firestore

The Cloud Run service identity needs Firestore access:

```bash
gcloud projects add-iam-policy-binding personal-website-490704 \
  --member="serviceAccount:github-actions-sa@personal-website-490704.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## One-Time Firebase Setup

Run inside the `frontend/` directory:

```bash
cd frontend
firebase init hosting
```

Select:
- **Project**: Use an existing project → `personal-website-490704`
- **Public directory**: `out`
- **Single-page app**: `No`
- **Automatic builds with GitHub**: `No` (handled by our workflow)

> `firebase.json` and `.firebaserc` are already committed — you may skip this step if they exist.

---

## Manual Backend Deploy

Use this for the **first deploy** to get the Cloud Run URL.

```bash
# Authenticate Docker with Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# Build image
docker build -f backend/Dockerfile \
  -t asia-southeast1-docker.pkg.dev/personal-website-490704/personal-website/backend:latest \
  backend/

# Push image
docker push asia-southeast1-docker.pkg.dev/personal-website-490704/personal-website/backend:latest

# Deploy to Cloud Run
gcloud run deploy personal-website-backend \
  --image asia-southeast1-docker.pkg.dev/personal-website-490704/personal-website/backend:latest \
  --platform managed \
  --region asia-southeast1 \
  --project personal-website-490704 \
  --allow-unauthenticated \
  --port 3001 \
  # --set-env-vars NODE_ENV=production
  --env-vars-file backend/.env.production
```

After deploy, note the **Service URL** printed in the output (e.g. `https://personal-website-backend-xxxx-as.a.run.app`). You will need this for the next step.

---

## GitHub Secrets Setup

Go to your repository → **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Contents of `gcp-sa-key.json` (the full JSON) |
| `NEXT_PUBLIC_API_URL` | Cloud Run backend URL from the step above (e.g. `https://personal-website-backend-xxxx-as.a.run.app`) |

> `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are no longer used and can be removed.

---

## Manual Frontend Deploy

Use this to test locally or redeploy without CI.

```bash
cd frontend

# Build static export (fetches data from backend at build time)
NEXT_PUBLIC_API_URL=https://personal-website-backend-xxxx-as.a.run.app npm run build
# Output: out/

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Firebase will print the live URL (e.g. `https://personal-website-490704.web.app`).

---

## CI/CD Workflows

### Backend (`backend-deploy.yml`)

**Trigger:** Push to `main` that modifies any file under `backend/`

**What it does:**
1. Authenticates to GCP using `GCP_SA_KEY`
2. Builds Docker image from `backend/Dockerfile`
3. Pushes image to Artifact Registry (`asia-southeast1-docker.pkg.dev/personal-website-490704/personal-website/backend:<git-sha>`)
4. Deploys new revision to Cloud Run service `personal-website-backend`

### Frontend (`frontend-deploy.yml`)

**Trigger:** Push to `main` that modifies any file under `frontend/`

**What it does:**
1. Installs Node.js 20 and runs `npm ci`
2. Runs `npm run build` with `NEXT_PUBLIC_API_URL` — Next.js fetches live data from the backend and pre-renders all pages to static HTML in `out/`
3. Deploys `out/` to Firebase Hosting using the GCP service account

---

## Verify Deployment

```bash
# Backend health check
curl https://personal-website-backend-xxxx-as.a.run.app/api/
# Expected: {"success":true,"message":"API is running"}

# Backend resume data
curl https://personal-website-backend-xxxx-as.a.run.app/api/resume

# Frontend: confirm data is embedded at build time (not loaded client-side)
curl https://personal-website-490704.web.app | grep -i "bayu"
# Expected: HTML containing the pre-rendered content
```

---

## Environment Variables Reference

### Backend (Cloud Run)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

Firestore authentication uses **Application Default Credentials** — no key file needed on Cloud Run when the service account has `roles/datastore.user`.

### Frontend (build time only)

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | GitHub Secret → injected during `npm run build` |
