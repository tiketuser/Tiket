# Google Cloud Run Deployment Guide

## Architecture

```
GitHub (push to main) → GitHub Actions → Build Docker Image → Push to Artifact Registry → Deploy to Cloud Run
```

Your Next.js app runs as a **standalone Node.js server** inside a Docker container on **Cloud Run** — a fully managed, auto-scaling, serverless platform. This supports SSR, API routes, middleware, and everything Next.js offers.

---

## One-Time GCP Setup

### 1. Enable Required APIs

Go to the [Google Cloud Console](https://console.cloud.google.com/apis/library) for project `tiket-9268c` and enable:

- **Cloud Run API**
- **Artifact Registry API**
- **Cloud Build API** (optional, only if using `cloudbuild.yaml`)

Or run in Cloud Shell / gcloud CLI:

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=tiket-9268c
```

### 2. Create an Artifact Registry Repository

This is where your Docker images will be stored.

```bash
gcloud artifacts repositories create tiket-repo \
  --repository-format=docker \
  --location=me-west1 \
  --description="Tiket app Docker images" \
  --project=tiket-9268c
```

### 3. Create a Service Account for GitHub Actions

```bash
# Create the service account
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer" \
  --project=tiket-9268c

# Grant required roles
gcloud projects add-iam-policy-binding tiket-9268c \
  --member="serviceAccount:github-deployer@tiket-9268c.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding tiket-9268c \
  --member="serviceAccount:github-deployer@tiket-9268c.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding tiket-9268c \
  --member="serviceAccount:github-deployer@tiket-9268c.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Download JSON key
gcloud iam service-accounts keys create github-deployer-key.json \
  --iam-account=github-deployer@tiket-9268c.iam.gserviceaccount.com
```

### 4. Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these secrets:

| Secret Name                                | Value                                                   |
| ------------------------------------------ | ------------------------------------------------------- |
| `GCP_SA_KEY`                               | Paste the entire contents of `github-deployer-key.json` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSyCGiiy5smPnTFY7RdhsHfe12briESgTr4k`               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `tiket-9268c.firebaseapp.com`                           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `tiket-9268c`                                           |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `tiket-9268c.firebasestorage.app`                       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `653453593991`                                          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:653453593991:web:67009ebea86a870f735722`             |
| `GEMINI_API_KEY`                           | Your Gemini API key                                     |

### 5. Deploy!

Simply push to the `main` branch:

```bash
git add .
git commit -m "Add Cloud Run deployment"
git push origin main
```

GitHub Actions will automatically:

1. Build the Docker image
2. Push it to Artifact Registry
3. Deploy it to Cloud Run
4. Print the live URL

---

## Useful Commands

```bash
# Check deployment status
gcloud run services describe tiket-app --region=me-west1

# View logs
gcloud run services logs read tiket-app --region=me-west1

# List revisions
gcloud run revisions list --service=tiket-app --region=me-west1

# Manual deploy (without CI/CD)
gcloud run deploy tiket-app \
  --source . \
  --region me-west1 \
  --port 8080 \
  --allow-unauthenticated
```

## Costs

Cloud Run charges only when your app is handling requests:

- **Free tier**: 2 million requests/month, 360,000 GB-seconds of memory
- After that: ~$0.00002400 per vCPU-second, ~$0.00000250 per GiB-second
- With `min-instances=0`, you pay nothing when there's no traffic

## Region Note

The workflow is configured for `me-west1` (Tel Aviv) to keep latency low for Israeli users. Change the `REGION` env var in the workflow file if needed.
