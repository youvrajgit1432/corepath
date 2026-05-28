# CorePath — Authentication Debug Report

## Root Cause Analysis

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **CAPTCHA failed to load** | Clerk Dashboard Attack Protection set to strict mode (Turnstile); ad blockers / extensions on client side | Switch to **Smart** or **Invisible** mode in Clerk Dashboard |
| **SSO callback 404** | `/sign-in/sso-callback` path not handled; Next.js 16 deprecated `middleware.ts` | ✅ Added `[[...rest]]` catch-all routes + renamed to `proxy.ts` |
| **Profile icon not clickable** | UserMenu dropdown missing `z-index`, potentially hidden behind other elements | ✅ Added `z-50` to dropdown; Clerk SDK failing to initialize also caused unresponsive state |
| **Middleware invocation failed** | Clerk env vars missing on Vercel at deploy time causing `MIDDLEWARE_INVOCATION_FAILED` | ✅ Added graceful fallback in `proxy.ts` — site loads without auth when env vars missing |
| **Empty page (0-byte response)** | Passthrough handler returned `new Response(null, { status: 200 })` instead of `undefined` | ✅ Fixed to `return undefined` so request flows through to Next.js page handler |
| **Local build vs production URL mismatch** | `NEXT_PUBLIC_APP_URL` pointed to `https://corepath.vercel.app` locally | ✅ Changed to `http://localhost:3000` in `.env.local` |

## Fixes Applied

### Code Changes (✅ Deployed)

| File | Change |
|------|--------|
| `proxy.ts` | Graceful passthrough when Clerk keys missing; returns `undefined` instead of empty Response |
| `app/sign-in/[[...rest]]/page.tsx` | Catch-all route for SSO callback (`/sign-in/sso-callback`) |
| `app/sign-up/[[...rest]]/page.tsx` | Catch-all route for SSO callback (`/sign-up/sso-callback`) |
| `app/layout.tsx` | Added `signInUrl="/sign-in"` and `signUpUrl="/sign-up"` to ClerkProvider |
| `components/UserMenu.tsx` | Added `z-50` to dropdown menu for proper stacking above overlays |
| `.env.local` | Fixed `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` |
| `package.json` | Added `"postinstall": "prisma generate"` for Vercel build pipeline |

## Working Environments

| Environment | Status | Notes |
|------------|--------|-------|
| **Localhost** (`http://localhost:3000`) | ✅ Works | Run `npm run dev` after `.env.local` is configured |
| **Production** (`https://corepath.vercel.app`) | ✅ Site loads | Auth requires Clerk Dashboard config + env vars set in Vercel |

## Steps Still Needed (User Action Required)

### 1. Clerk Dashboard — Allowed Redirect URLs

Go to **Clerk Dashboard → User & Authentication → Redirect URLs** and add **ALL** of these:

```
http://localhost:3000
http://localhost:3000/sign-in
http://localhost:3000/sign-up
http://localhost:3000/sign-in/sso-callback
https://corepath.vercel.app
https://corepath.vercel.app/sign-in
https://corepath.vercel.app/sign-up
https://corepath.vercel.app/sign-in/sso-callback
```

### 2. Clerk Dashboard — Attack Protection (CAPTCHA fix)

Go to **Clerk Dashboard → Security → Attack Protection** and:

- Set **"Bot sign-up protection"** to **Smart** or **Invisible** mode
- If issues persist, temporarily disable it entirely to verify
- Smart mode uses Cloudflare Turnstile which loads invisibly in most browsers

### 3. Clerk Dashboard — OAuth Providers

Go to **Clerk Dashboard → User & Authentication → Social Connections** and verify:

- Google OAuth is enabled
- GitHub OAuth is enabled (if desired)
- Redirect URIs include both `http://localhost:3000` and `https://corepath.vercel.app`

### 4. Clerk Dashboard — Webhook URL

Go to **Clerk Dashboard → Webhooks** and update endpoint to:

```
https://corepath.vercel.app/api/webhooks/clerk
```

With events: `user.created`, `user.updated`, `user.deleted`

### 5. Vercel Environment Variables

Verify these are ALL set in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_YXdha2UtdGhydXNoLTYwLmNsZXJrLmFjY291bnRzLmRldiQ` |
| `CLERK_SECRET_KEY` | `sk_test_FVr5oEWIbEJpiIl264ltBqb9LxFRifHuNfQjhn5lQx` |
| `CLERK_WEBHOOK_SECRET` | `whsec_+DGKzatvAPH+MIsDJxDZJYuyH10G3Ssp` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_zGZ4lvVCS7xQ@ep-orange-paper-aoz337lk.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | `https://corepath.vercel.app` |

### 6. Browser Testing

Test in Chrome Incognito (no extensions interfere):

1. Visit `http://localhost:3000` — sign in with Google/GitHub
2. Visit `https://corepath.vercel.app` — sign in with Google/GitHub
3. Check profile icon is clickable and dropdown appears
4. Check sign-out works and redirects to home

## Known Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Clerk test keys expire** | Currently using Clerk development instance keys (prefixed `pk_test_` / `sk_test_`) | Switch to production keys (`pk_live_` / `sk_live_`) before public launch |
| **CAPTCHA on mobile** | Cloudflare Turnstile can fail on slow connections or older devices | Configure Smart mode in Clerk Dashboard — falls back gracefully |
| **Clerk rate limits** | Development instances have rate limits (100 requests/sec) | Monitor usage; upgrade to production plan for higher limits |
| **Prisma generate on Vercel** | `postinstall` hook runs `prisma generate` — requires `DATABASE_URL` env var | Ensure `DATABASE_URL` is set in Vercel dashboard before redeploy |

## Build Validation

```
npm run build    ✅ Passed (0 errors, 17+ routes)
npx tsc --noEmit ✅ Passed (0 errors)
proxy.ts         ✅ Graceful fallback when Clerk unconfigured
```
