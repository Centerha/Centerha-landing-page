# Legacy pages (unpublished)

These pages predate the live-data landing site and are **not linked from any
navigation**. They contain non-production patterns that must not go public:

- `pages/form.html` + `js/forms.js` — a "booking request" form that only saves
  to localStorage (a fake submission).
- `pages/comments.html` + `js/comments.js` — hardcoded fake player reviews.
- `pages/questions.html` + `js/questions.js` — static FAQ superseded by the
  live FAQ section on the home page.
- `pages/add-field.html` — form-field configurator demo.

They are kept only for reference and are excluded from crawling via
`robots.txt` (`Disallow: /_legacy/`). Safe to delete entirely.
