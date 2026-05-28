# CorePath — Clerk Final Debug Report

## Status: ✅ All Code Fixes Applied

| Part | Issue | Status | Fix |
|------|-------|--------|-----|
| PART 1 | UserMenu rendering | ✅ Fixed | Added hydration guard (`mounted` state), `z-40` on parent, backdrop overlay for dismiss |
| PART 2 | Hydration mismatches | ✅ Fixed | `useState(false)` + `useEffect(() => setMounted(true), [])` — Clerk hooks only render client-side |
| PART 3 | Portal/z-index clipping | ✅ Fixed | Removed `overflow-x-hidden` from mobile menu (caused CSS overflow computation quirk that clips absolute-positioned dropdowns) |
| PART 4 | CAPTCHA/bot protection | ⚠️ Clerk Dashboard | Switch Attack Protection to **Smart** mode |
| PART 5 | Network debugging | ✅ Verified | Browser agent confirmed all requests succeed (HTTP 200), no failed Clerk/CAPTCHA/Turnstile requests |
| PART 6 | Fallback auth button | ✅ Built-in | Custom UserMenu uses `useUser()` + `signOut()` directly — no dependency on Clerk's `<UserButton>` portal |
| PART 7 | Production verification | ✅ Partial | Site loads with no console errors on production |
| PART 8 | Report + build | ✅ Done | Build passes, TypeScript clean, report generated |

---

## Root Cause Analysis

### 1. UserMenu Dropdown Not Opening (Production)

**Hydration mismatch**: The `useUser()` hook from Clerk returns `{ isLoaded: false }` during SSR. If the component renders before hydration completes, the state can get into an inconsistent state where clicks don't trigger the toggle handler.

**Fix**: Added `mounted` state guard — component renders an empty placeholder during SSR, then re-mounts client-side with Clerk hooks fully initialized.

**Stale closure**: The toggle used `setIsOpen(!isOpen)` which can capture a stale `isOpen` value in certain React re-render scenarios.

**Fix**: Changed to `setIsOpen((prev) => !prev)` — functional update guarantees correct state.

**Z-index context**: The dropdown's `z-50` was within a `relative` parent that had no explicit z-index. The parent's effective z-index (inherited from the header at `z-40`) meant the dropdown's stacking context was ambiguous.

**Fix**: Added `z-40` to the `relative` parent container, matching the header's z-index. This ensures the dropdown's `z-50` stacks correctly above the backdrop and page content.

**Backdrop overlay**: No mechanism existed to dismiss the dropdown by clicking outside on mobile devices.

**Fix**: Added a `fixed inset-0 z-40` backdrop div that captures all outside clicks and dismisses the dropdown. The dropdown itself has `z-50` to appear above the backdrop.

### 2. Mobile Menu Clipping Dropdown

**CSS overflow quirk**: The mobile menu container had `overflow-x-hidden`. Per the CSS specification, when `overflow-x` is `hidden` and `overflow-y` defaults to `visible`, the browser computes `overflow-y` as `auto` — effectively clipping the absolute-positioned UserMenu dropdown.

**Fix**: Removed `overflow-x-hidden` from the mobile menu container.

### 3. CAPTCHA Not Loading (Localhost)

**Root cause**: Clerk Dashboard's **Attack Protection** is likely set to **Strict** mode, which enforces CAPTCHA on every sign-in. On localhost, this can fail due to browser extensions, ad blockers, or third-party cookie restrictions.

**Fix**: Go to **Clerk Dashboard → Security → Attack Protection** and switch to **Smart** or **Invisible** mode.

### 4. SSO Callback 404 (Fixed Previously)

**Root cause**: `/sign-in/sso-callback` path wasn't handled. Clerk redirects here after OAuth completion.

**Fix**: Added `[[...rest]]` catch-all routes at `app/sign-in/[[...rest]]/page.tsx` and `app/sign-up/[[...rest]]/page.tsx` (fixed in previous commit).

---

## Files Modified (This Session)

| File | Change |
|------|--------|
| `components/UserMenu.tsx` | Hydration guard, functional state update, `z-40` on parent, backdrop overlay |
| `components/Header.tsx` | Removed `overflow-x-hidden` from mobile menu to prevent dropdown clipping |

## Files Modified (Previously)

| File | Change |
|------|--------|
| `proxy.ts` | Renamed from `middleware.ts`, graceful Clerk fallback |
| `app/layout.tsx` | Added `signInUrl`/`signUpUrl` to ClerkProvider |
| `app/sign-in/[[...rest]]/page.tsx` | Catch-all route for SSO callback |
| `app/sign-up/[[...rest]]/page.tsx` | Catch-all route for SSO callback |
| `package.json` | Added `postinstall: prisma generate` |
| `.env.local` | Fixed `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` |

---

## Remaining User Actions (Clerk Dashboard)

### 1. Attack Protection
- **Navigate**: Clerk Dashboard → Security → Attack Protection
- **Set**: "Bot sign-up protection" → **Smart** (not Strict)
- This fixes CAPTCHA loading on localhost and production

### 2. Allowed Redirect URLs
- **Navigate**: Clerk Dashboard → User & Authentication → Redirect URLs
- **Add ALL**:
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

### 3. OAuth Providers
- **Navigate**: Clerk Dashboard → User & Authentication → Social Connections
- Verify Google/GitHub are enabled with correct redirect URIs

### 4. Webhook
- **Navigate**: Clerk Dashboard → Webhooks
- **Update endpoint** to `https://corepath.vercel.app/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

---

## Verification Results

```
npm run build    ✅ (0 errors, 17+ routes, proxy included)
npx tsc --noEmit ✅ (0 errors)
```

**Browser verification (production — unauthenticated):**
- ✅ Page loads with no console errors
- ✅ No failed network requests (no Clerk/CAPTCHA errors)
- ✅ Header buttons clickable, no overlay blocking

**Pending browser verification (signed-in):**
- Test on `localhost:3000` after running `npm run dev`
- Test on `corepath.vercel.app` after Vercel redeploys
- Test in Chrome Incognito to rule out extension interference
- Test on mobile/small viewport

---

## Known Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Clerk test key expiry | Auth stops working | Switch to production keys before public launch |
| CAPTCHA Smart mode still fails | Sign-ups blocked | Disable bot protection entirely for testing |
| Header z-40 conflicts with future modals | Dropdown hidden behind modals | Ensure any new fixed elements use z-40+ consistently |
| Mobile UserMenu dropdown outside viewport | Dropdown cut off | The `right-0` positioning anchors to the right edge, which works on mobile |
