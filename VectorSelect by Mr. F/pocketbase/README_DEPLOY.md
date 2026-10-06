# VectorSelect PocketBase Backend Guide

This folder contains the complete backend orchestration engine for **VectorSelect by Mr. F**.

---

## 1. Quickstart: Local Offline Classroom Mode (Air-Gapped)

1. Double-click `run_pocketbase.bat`.
   - On first launch, it automatically downloads the single `pocketbase.exe` Windows binary into this directory.
   - It boots PocketBase on `http://127.0.0.1:8090` with embedded SQLite and loads `pb_hooks/score_submission.pb.js`.
2. Open `http://127.0.0.1:8090/_/` in your browser.
3. Create your initial Teacher Admin Account (email & password).
4. Go to **Settings** -> **Sync** (or **Import collections**) and select `pocketbase_schema.json` to load all 4 collections:
   - `answer_keys`
   - `active_assignments`
   - `exam_submissions`
   - `live_events`
5. Seed all 106 official answer keys with one command:
   ```powershell
   python scripts/push_keys_to_pocketbase.py --url http://127.0.0.1:8090 --email YOUR_ADMIN_EMAIL --password YOUR_ADMIN_PASSWORD
   ```

---

## 2. Cloud Deployment (Free & Ultra-Fast)

Deploying PocketBase to the cloud gives students and teachers 24/7 global access with zero server maintenance.

### Option A: Fly.io (Recommended — Free SSL, Sub-20ms Latency)

1. Install Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Inside `pocketbase/`, create `Dockerfile`:
   ```dockerfile
   FROM alpine:latest
   RUN apk add --no-cache ca-certificates wget unzip
   WORKDIR /pb
   RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.4/pocketbase_0.22.4_linux_amd64.zip && \
       unzip pocketbase_0.22.4_linux_amd64.zip && \
       rm pocketbase_0.22.4_linux_amd64.zip
   COPY ./pb_hooks /pb/pb_hooks
   EXPOSE 8080
   CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks"]
   ```
3. Run `fly launch` and follow the prompts.
4. Mount persistent storage for SQLite data:
   ```bash
   fly volumes create pb_data --size 1
   ```
5. Deploy: `fly deploy`. Your PocketBase URL will be `https://your-app-name.fly.dev`.

### Option B: Railway / Render / DigitalOcean
- Deploy using the same 1-file Dockerfile above.
- In PocketBase Admin UI (`Settings` -> `Application`), add your GitHub Pages domain (e.g. `https://fahad87-tech.github.io`) to **Allowed Origins (CORS)**.

### Connect the GitHub Pages frontend

GitHub Pages serves only the static frontend. Students on different computers
must all use the same publicly reachable PocketBase HTTPS URL.

1. Open `pocketbase_public_config.js` in the repository.
2. Set:
   ```js
   window.VECTORSELECT_POCKETBASE_URL = "https://your-pocketbase-domain.example";
   ```
3. Commit and push that file with the frontend.
4. Add the exact GitHub Pages origin to PocketBase CORS, then restart PocketBase
   after installing the migration and hook changes.

Do not use `http://127.0.0.1:8090` or `localhost` in the GitHub Pages build.
Those addresses refer to each student's own computer. The app uses localhost
only when opened locally for development.

---

## 3. Architecture & Security Guarantees

- **Enclave Answer Keys (`answer_keys`)**:
  - API Rules restrict read access to authenticated teachers (`@request.auth.role = 'teacher'`).
  - Public students have zero read or query access.
- **Server-Side Atomic Grading (`pb_hooks/score_submission.pb.js`)**:
  - Exposes `POST /api/score-submission`.
  - Grades submissions inside the PocketBase Go/JS runtime using internal system privileges.
  - Returns only verified score tallies and anti-cheat telemetry.
