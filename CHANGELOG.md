# Changelog

## 2026-07-05 — Localization polish

- Typography: switched to an Arabic-first font stack — Cairo for Arabic (with Tajawal / IBM Plex Sans Arabic / Noto Sans Arabic fallbacks) and Inter for English, `display=swap`, across all pages. Arabic headlines got proper line-height (1.28–1.45) and weight 700–800 for Cairo's taller glyphs.
- Arabic copy rewritten into professional Syrian tone across the homepage, search page, field page states, and content page (e.g. "دوّر على ملعب", "صار في مشكلة بجلب البيانات… جرب مرة تانية", "ما لقينا ملاعب مطابقة لهالفلاتر حالياً"). Gulf-dialect phrasings (عشان/وش/جوّالك) replaced with Syrian equivalents.
- Honesty fixes in copy: removed the nonexistent "distance" filter claim from How-it-works (AR + EN).
- Arabic count grammar: 2–10 now take the plural ("3 محافظات", "8 منشآت") in hero meta, city/venue cards, and search result counts.
- Prices: graceful fallback when the API has no price — "السعر غير محدد" / "Price not available" (never NaN); currency labels remain ل.س / SYP.
- Syria-only audit passed: no foreign cities/currencies/global claims anywhere in the served tree.

## 2026-07-05

- v3 polish: added a dedicated backend-powered search page (`search/`) using public `GET /api/catalog/public` — keyword + governorate + pitch-size filters, URL-driven state (shareable links, works with the homepage hero form's native GET), pagination, and loading/error/empty states.
- Added `CenterhaApi.searchCatalog()` to `assets/js/api.js` and `assets/js/search-page.js` (self-contained, textContent-only rendering).
- Removed all remaining fake claims: partner logo strip, fake testimonials (replaced by an honest "coming soon" roadmap), fake ratings/metrics, and fake app-store links (store badges are now explicit non-link "coming soon" chips).
- Fixed `CNAME`: `centerha.software.com` → `centerha.software`.
- Consolidated new CSS (hero search panel, roadmap cards, pager, owner capability list, coming-soon badges) in `assets/css/live.css`.
- Connected the landing page to the Centerha backend (`GET /api/home/landing`): live platform stats, per-governorate cities, pitch-size categories, featured/recent pitches, popular venues, promotional banners, and footer content-page links.
- Added `assets/js/config.js` (single configurable API base URL), `assets/js/api.js` (API client + response documentation), and `assets/js/landing.js` (rendering, bilingual output, client-side city/size filters, count-up stats).
- Replaced the hardcoded stats strip and hero counters with real API data; sections stay hidden until real data arrives — no fake counts.
- Added loading skeletons, an error state with retry, empty-data states, and image fallbacks (pitch-lines placeholder; broken images never show).
- Added `pages/content.html` + `assets/js/content-page.js`: renders backend content pages (privacy, terms, …) by slug with HTML sanitization.
- All new UI is bilingual (data-en/data-ar) and RTL-safe via logical CSS properties (`assets/css/live.css`).

## 2026-05-29

- Prepared the static Centerha landing page for GitHub publishing.
- Added repository metadata files.
- Documented project structure, editing workflow, local usage, and GitHub Pages deployment.
