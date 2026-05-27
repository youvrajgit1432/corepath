# CorePath — Final Release Checklist

> Generated: May 27, 2026  
> Project: CorePath Frontend (v2.2.0)  
> Environment: Next.js + React + TypeScript + Tailwind CSS

---

## ✅ Mobile QA

| Check | Status | Notes |
|-------|--------|-------|
| Tap targets ≥ 44×44px | ⬜ | |
| Bottom nav works (dashboard mode) | ⬜ | CommandCenterTabs mobile bar |
| No horizontal overflow on 375px+ screens | ⬜ | overflow-x-hidden set on body/html |
| Swipe gestures on home tabs | ⬜ | useSwipe hook active in ProgressiveHome |
| Mobile CTA bar on career detail pages | ⬜ | Fixed bottom CTA with quiz/careers/compare |
| Safe area insets respected | ⬜ | pb-[env(safe-area-inset-bottom)] on mobile nav |
| Touch-friendly filter bar | ⬜ | Careers filter bar with scroll-based hide |

## ✅ Desktop QA

| Check | Status | Notes |
|-------|--------|-------|
| Header navigation links work | ⬜ | Home, Careers, Quiz |
| All pages render without errors | ⬜ | |
| Filter bar on careers page | ⬜ | Category tabs + filter bar sticky header |
| Compare mode works | ⬜ | Two-career selection + compare report |
| Footer links present | ⬜ | Product, Resources, Privacy sections |
| Theme toggle works | ⬜ | Light/dark mode via ThemeToggle |
| Notification bell works | ⬜ | Reads from notification-engine |

## ✅ Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| Skip-to-content link | ✅ | `.skip-to-content` CSS class in globals.css |
| Semantic HTML | ⬜ | `<main>`, `<nav>`, `<header>`, `<footer>` used |
| ARIA labels on interactive elements | ⬜ | Header, nav, buttons, mobile menu |
| Keyboard navigation | ⬜ | Focus-visible outlines present |
| Focus trap in mobile menu | ⬜ | Escape key closes menu |
| Reduced motion support | ✅ | `prefers-reduced-motion` media query |
| Error boundary fallback accessible | ⬜ | `role="alert"` in ErrorBoundary |

## ✅ Performance

| Check | Status | Notes |
|-------|--------|-------|
| Build succeeds without errors | ⬜ | Run `npm run build` |
| TypeScript compiles without errors | ⬜ | Run `npx tsc --noEmit` |
| No console errors in production | ⬜ | |
| No unnecessary re-renders | ⬜ | useMemo / useCallback used in key components |
| Static page generation | ⬜ | generateStaticParams in career/[id] and insights/[slug] |
| CSS minimal / no unused styles | ⬜ | Tailwind purge enabled |
| Image optimization | ⬜ | OG image = static, no external images |

## ✅ Navigation

| Check | Status | Notes |
|-------|--------|-------|
| / → Home | ⬜ | ProgressiveHome or CommandCenterTabs |
| /quiz → Quiz | ⬜ | QuizShell with questions |
| /recommendation → Recommendations | ⬜ | Redirect after quiz or empty state |
| /careers → Career explorer | ⬜ | Grid + filters + compare |
| /careers/[id] → Career detail | ⬜ | Skill tree, roadmap, workspaces |
| /careers/compare → Compare | ⬜ | Side-by-side comparison |
| /insights → Insights landing | ⬜ | SEO content pages |
| /insights/[slug] → Insight detail | ⬜ | Generated content pages |
| /admin → Admin dashboard | ⬜ | Password-gated (mock: "admin") |
| /admin/insights → Product insights | ⬜ | |
| /admin/debug → Debug dashboard | ⬜ | Only in development |
| /admin/accessibility → A11y debug | ⬜ | Only in development |

## ✅ Git Status

| Check | Status | Notes |
|-------|--------|-------|
| No uncommitted work-in-progress | ⬜ | |
| CHANGELOG.md updated | ⬜ | |
| VERSION.json updated | ⬜ | |
| release-manifest.json updated | ⬜ | |

## ✅ Build Status

| Check | Status | Notes |
|-------|--------|-------|
| `npm run build` passes | ⬜ | |
| `npx tsc --noEmit` passes | ⬜ | |
| `npm test` passes | ⬜ | Vitest unit tests |
| `npm run test:e2e` passes | ⬜ | Playwright e2e tests |

## ✅ Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Admin login uses hardcoded password "admin" | Low | Mock auth gate, documented on page |
| Console.log in performance-debug.ts renders | Low | Only active in development |
| Console.warn in safe-storage.ts fallback | Low | Only when localStorage fails |
| Footer links (#) are placeholder anchors | Low | No blog / docs pages exist yet |
| Admin debug/accessibility pages blocked in production | Low | Intentionally dev-only |
| Recommendation requires ?results= URL param | Medium | Empty state redirects to quiz |
| No backend API — all data is local/static | Medium | careers.json, local storage, static generation |

## ✅ Deployment Steps

1. **Final checks**
   ```bash
   npx tsc --noEmit
   npm run build
   npm test
   ```

2. **Update version** (if needed)
   - Edit `VERSION.json`
   - Add entry to `CHANGELOG.md`

3. **Deploy**
   ```bash
   npm run build
   # Output in .next/ directory — deploy to Vercel / Cloudflare Pages / Netlify
   ```

4. **Post-deploy**
   - Verify all routes return 200
   - Verify robots.txt and sitemap.xml are accessible
   - Test on mobile device
   - Verify Open Graph preview on social media
   - Check analytics events fire correctly

---

*This checklist should be walked through before every production release.*
