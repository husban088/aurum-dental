# Deploy everything on Vercel (frontend + backend) + MongoDB Atlas

Vercel cannot run Java, so the backend for Vercel is `frontend/api` + `frontend/server` (Node.js serverless functions).
It has the same endpoints as the Java API, plus notifications (`/notify/recent`) and analytics (`/analytics/summary`)
computed directly from MongoDB, so Kafka, Kotlin and Python are not needed on Vercel.
The Java / Kotlin / Python / Docker version stays in the repo and still works locally with `docker compose up --build`.

## 1. MongoDB Atlas
1. mongodb.com/atlas -> free M0 cluster.
2. Database Access -> add user + password (no special characters like @ # / in the password).
3. Network Access -> Add IP Address -> `0.0.0.0/0` (Vercel has no fixed IP).
4. Connect -> Drivers -> copy the string and put `/aurum` before the `?`:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/aurum?retryWrites=true&w=majority`

## 2. Vercel
1. vercel.com -> Add New -> Project -> import `husban088/aurum-dental`.
2. **Root Directory = `frontend`** (Edit button). Framework preset: Angular (auto).
3. Environment Variables (before pressing Deploy):
   - `MONGO_URI` = Atlas string from step 1
   - `JWT_SECRET` = any long random string
4. Deploy.

## 3. Test
- `https://<your-project>.vercel.app/api/reviews` must show JSON (6 sample reviews on first run).
- Open the site, sign up, book an appointment, open `/dashboard`.

If you change environment variables later, redeploy (Deployments -> ... -> Redeploy).
