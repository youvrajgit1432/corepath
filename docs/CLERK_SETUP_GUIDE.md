# Clerk Setup Guide for CorePath

This guide walks through setting up Clerk authentication for CorePath — from creating an application to configuring webhooks.

---

## 1. Create a Clerk Application

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign up or sign in with your account
3. Click **"Create application"**
4. Name your application (e.g., "CorePath")
5. Select authentication providers:
   - ☑ **Email** (built-in email/password)
   - ☑ **Google** (OAuth — starts with development credentials)
6. Click **"Create application"**

---

## 2. Get Your API Keys

1. In the Clerk Dashboard sidebar, navigate to **API Keys**
2. Copy the following values:

| Variable | Where to find it | Example |
|----------|-----------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | API Keys → Publishable Key | `pk_test_xxxxxxxxxxxxxxxxxxx` |
| `CLERK_SECRET_KEY` | API Keys → Secret Key | `sk_test_xxxxxxxxxxxxxxxxxxx` |

3. Add them to your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxx
```

---

## 3. Configure Google OAuth

By default, Clerk provides **development OAuth credentials** for Google so you can start testing immediately.

### For Production
When you're ready to go live:

1. Go to **SSO Connections** in the Clerk Dashboard sidebar
2. Click **Google → Configure**
3. Create credentials in the [Google Cloud Console](https://console.cloud.google.com/):
   - Create an OAuth 2.0 Client ID (Web application)
   - Add Authorized redirect URIs:
     - `https://your-domain.com/api/clerk/oauth/callback`
   - Add Authorized JavaScript origins:
     - `https://your-domain.com`
4. Copy the **Client ID** and **Client Secret** into Clerk's Google configuration

---

## 4. Configure Redirect URLs

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Clerk will redirect users to these paths after authentication events.

---

## 5. Set Up the Webhook Endpoint

The webhook syncs Clerk users to your local PostgreSQL database.

### Create the Endpoint

1. In the Clerk Dashboard sidebar, go to **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://your-domain.com/api/webhooks/clerk`
   - For local development, use [ngrok](https://ngrok.com/) to expose `http://localhost:3000`:
     ```bash
     ngrok http 3000
     # → https://abc123.ngrok-free.app
     ```
     Then use: `https://abc123.ngrok-free.app/api/webhooks/clerk`
4. **Events to listen for:**
   - ☑ `user.created`
   - ☑ `user.updated`
   - ☑ `user.deleted`
5. Click **"Create"**

### Get the Webhook Secret

1. After creating the endpoint, click on it to view details
2. Find the **Signing Secret** (starts with `whsec_`)
3. Add it to your `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxx
```

4. Click the **"Reveal"** (eye icon) to copy the secret

---

## 6. Test the Integration

### Start the dev server:
```bash
npm run dev
```

### Verify sign-in works:
1. Visit `http://localhost:3000/sign-in`
2. You should see the Clerk sign-in form with:
   - Email/password fields
   - "Continue with Google" button
   - "Create account" link

### Verify protected routes redirect:
1. Visit `http://localhost:3000/dashboard`
2. You should be redirected to `/sign-in`
3. Sign in, then verify you're redirected to `/dashboard`

### Verify the webhook (with ngrok):
1. Start ngrok: `ngrok http 3000`
2. Update the webhook endpoint URL in Clerk Dashboard
3. Create a new user account
4. Check your server logs for:
   ```
   [Clerk Webhook] User created: user_xxxxxxxxxxxx
   ```

---

## 7. Deploy to Production

1. Set all environment variables in your hosting platform (Vercel, etc.)
2. Update the webhook endpoint URL to your production domain
3. Replace Google OAuth development credentials with production credentials
4. **Switch API keys to live:**
   - In Clerk Dashboard → API Keys
   - Click **"Go live"** to generate production keys
   - Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
5. Run `prisma migrate deploy` on the production database

---

## Environment Variables Summary

| Variable | Required | Where to Get It |
|----------|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | ✅ | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | ✅ | Clerk Dashboard → Webhooks → Endpoint → Signing Secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional | Set to `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Optional | Set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Optional | Set to `/dashboard` |

---

## Troubleshooting

### "Module not found: Can't resolve '@clerk/nextjs'"
Run: `npm install @clerk/nextjs`

### "Missing publishable key" error
Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local` and restart the dev server.

### Webhook returns 400 "Missing svix headers"
The webhook endpoint needs to be publicly accessible (use ngrok for local dev).

### "User not found in database" when using server persistence
Trigger the webhook manually: create a test user in Clerk, or check that the webhook endpoint URL is correct.
