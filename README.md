# FitCoach Pro

A standalone production-minded MVP for an AI weight-loss coach:

- Email/password auth with JWT
- Mifflin-St Jeor calorie target calculation
- Profile setup
- Weight logs
- Manual meal logs
- Food photo upload to Supabase Storage
- AI food photo calorie/macros estimation
- Daily dashboard
- AI coach using the user's profile, meals, weight data, and memories
- PWA static frontend
- Render backend + Vercel frontend deployment

## Important honesty note

This is a strong launchable MVP codebase, not a guaranteed enterprise/compliance-grade medical product. Before charging users at scale, add Stripe billing, automated tests, monitoring, a privacy policy, terms, backups, and a medical disclaimer. Food photo calorie estimates are approximate.

## Folder structure

```text
fitcoach_pro/
  backend/
    src/
      db/schema.sql
      routes/
      services/
      server.js
  frontend/
    index.html
    style.css
    script.js
    config.js
  supabase/storage_setup.sql
  render.yaml
```

## 1. Create Supabase project

1. Go to Supabase.
2. Create a new project.
3. Copy your database connection string.
4. In SQL Editor, run:

```sql
-- supabase/storage_setup.sql
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;
```

The backend migration creates the app tables automatically when Render builds.

## 2. OpenAI key

Create an OpenAI API key and add it to Render as `OPENAI_API_KEY`.

The backend uses the OpenAI Responses API with image input for food photo estimates and text coaching.

## 3. Backend deployment on Render

Official Render docs support deploying Node/Express web services from a Git repo.

1. Create a GitHub repo.
2. Upload this whole `fitcoach_pro` folder.
3. Render > New > Web Service.
4. Connect your repo.
5. Use:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run migrate`
   - Start Command: `npm start`
6. Add env vars from `backend/.env.example`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
JWT_SECRET=make_this_long_random_and_private
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=meal-photos
MAX_IMAGE_MB=8
```

7. Deploy.
8. Test this URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

You should see:

```json
{"ok":true,"app":"FitCoach Pro API"}
```

## 4. Frontend deployment on Vercel

Official Vercel docs support deploying static folders and Git-connected projects.

1. Open `frontend/config.js`.
2. Change:

```js
window.FITCOACH_API_BASE = 'https://YOUR-RENDER-SERVICE.onrender.com';
```

3. Vercel > Add New Project.
4. Select repo.
5. Set root directory to `frontend`.
6. Build command: leave blank.
7. Output directory: leave blank or `.`.
8. Deploy.
9. Go back to Render and update `FRONTEND_ORIGIN` to your real Vercel URL.
10. Redeploy backend.

## 5. Local development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Frontend:

Open `frontend/index.html` using a local static server, for example:

```bash
cd frontend
python -m http.server 5173
```

Then visit:

```text
http://localhost:5173
```

## 6. What to build next

Priority next production upgrades:

1. Stripe subscription billing
2. Email verification/password reset
3. Firebase Cloud Messaging for reminders
4. Better charts
5. Admin dashboard
6. Terms/privacy pages
7. Automated tests
8. Sentry/Logtail monitoring
9. Data export/delete account flow
10. App Store/Play Store wrapper using Capacitor

## API summary

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Profile:

- `GET /api/profile`
- `PUT /api/profile`

Meals:

- `GET /api/meals`
- `POST /api/meals`
- `POST /api/meals/photo`
- `DELETE /api/meals/:id`

Weights:

- `GET /api/weights`
- `POST /api/weights`

Coach:

- `POST /api/coach/chat`
- `GET /api/coach/history`
- `POST /api/coach/memories`

Dashboard:

- `GET /api/dashboard`
