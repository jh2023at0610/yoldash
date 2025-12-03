# Deployment Configuration

## Railway Backend
- **URL:** https://yoldash-production.up.railway.app
- **Environment:** production
- **Service:** yoldash

## Vercel Frontend
- **Environment Variable Required:**
  ```
  VITE_API_URL=https://yoldash-production.up.railway.app
  ```

## Vercel Configuration Steps

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://yoldash-production.up.railway.app`
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. Go to **Deployments** tab
6. Click **Redeploy** (three dots menu → Redeploy)

## Post-Deployment Checklist

### Railway Backend
- [ ] All environment variables set:
  - `GEMINI_API_KEY`
  - `JWT_SECRET`
  - `FIREBASE_SERVICE_ACCOUNT_KEY`
  - `FILE_SEARCH_STORE_NAME`
  - `PORT=3001`
- [ ] Deployment shows "Active" (green)
- [ ] Check logs for errors
- [ ] Test health endpoint: https://yoldash-production.up.railway.app/api/health

### Vercel Frontend
- [ ] `VITE_API_URL` environment variable set
- [ ] Redeployed after adding env var
- [ ] Test the live site
- [ ] Test registration
- [ ] Test login
- [ ] Test chat functionality

### Firebase
- [ ] Production Firebase project configured
- [ ] Firestore enabled
- [ ] Service account key added to Railway
- [ ] Set admin user in Firestore (isAdmin: true)

## Testing Live Site

1. **Test Registration:**
   - Open your Vercel URL
   - Go to `/register`
   - Register a new account
   - Should get 20 tokens

2. **Test Login:**
   - Log out
   - Log in with registered account

3. **Test Chat:**
   - Send a message
   - Balance should decrease from 20 to 19
   - Check response from Gemini

4. **Test Admin Panel:**
   - Set `isAdmin: true` for your account in Firestore
   - Go to `/admin`
   - View users
   - Add tokens
   - Delete users

## Common Issues

### Frontend can't connect to backend
- **Solution:** Add `VITE_API_URL` to Vercel and redeploy

### Backend crashes on Railway
- **Check:** All environment variables are set
- **Check:** Firebase credentials are correct

### CORS errors
- **Check:** Railway URL is correct in Vercel env var
- **Check:** No trailing slash in `VITE_API_URL`

## URLs

- **Frontend (Vercel):** [Your Vercel URL]
- **Backend (Railway):** https://yoldash-production.up.railway.app
- **Admin Panel:** [Your Vercel URL]/admin

