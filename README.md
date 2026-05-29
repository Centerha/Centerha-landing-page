# Centerha Landing Page

A static bilingual landing page and supporting pages for Centerha, a football pitch booking experience for players and venue owners.

The project is plain HTML, CSS, and JavaScript. It does not require a build step, package manager, or backend service.

## Features

- Responsive landing page with the existing Centerha visual design.
- Separate pages for booking forms, field configuration, comments, and questions.
- Arabic and English language support with RTL/LTR switching.
- Centralized translations for shared pages.
- Editable form fields driven by a JavaScript configuration.
- Editable comments and questions driven by simple JavaScript arrays.
- Organized CSS split into design, layout, components, and responsive files.
- Ready for GitHub Pages deployment as a static site.

## Project Structure

```txt
.
├── index.html
├── pages/
│   ├── form.html
│   ├── add-field.html
│   ├── comments.html
│   └── questions.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── main.js
│   │   ├── language.js
│   │   ├── forms.js
│   │   ├── comments.js
│   │   └── questions.js
│   └── images/
│       └── logo-mark.png
├── README.md
├── CHANGELOG.md
├── .editorconfig
└── .gitignore
```

## Pages

- `index.html` - main landing page.
- `pages/form.html` - booking form page.
- `pages/add-field.html` - field configuration overview.
- `pages/comments.html` - player and venue feedback cards.
- `pages/questions.html` - question / FAQ page.

## Language Support

The site supports English and Arabic.

- English uses `lang="en"` and `dir="ltr"`.
- Arabic uses `lang="ar"` and `dir="rtl"`.
- The selected language is saved in `localStorage`.
- Shared page translations live in `assets/js/language.js`.

The landing page still keeps its existing `data-en` and `data-ar` spans so its original design and content remain stable. The secondary pages use `data-i18n` keys and the centralized translation object.

## Editing Translations

Open `assets/js/language.js` and edit `window.CenterhaTranslations`.

Example:

```js
window.CenterhaTranslations = {
  en: {
    submitButton: "Submit request"
  },
  ar: {
    submitButton: "إرسال الطلب"
  }
};
```

Then use the key in HTML:

```html
<span data-i18n="submitButton"></span>
```

## Editing Form Fields

Form fields are managed in `assets/js/forms.js` inside `fieldConfig`.

Each field can define:

- `key` - the input `id` and `name`.
- `type` - `text`, `tel`, `date`, `time`, `select`, or `textarea`.
- `labelKey` - translation key from `language.js`.
- `placeholderKey` - optional translation key.
- `required` - `true` or `false`.
- `options` - select options with `en` and `ar` values.
- `span: "full"` - makes the field full width.

The form page and field management page both read from the same field configuration.

## Editing Comments

Comments are managed in `assets/js/comments.js`.

Edit the `comments` array to add, remove, or update feedback cards. Each comment supports bilingual `name`, `location`, and `body` values.

## Editing Questions

Questions are managed in `assets/js/questions.js`.

Edit the `questions` array to add, remove, or update FAQ items. Each item has bilingual `q` and `a` values.

## Run Locally

Because this is a static site, you can open `index.html` directly in a browser.

For a local server, run one of these from the project root:

```bash
python3 -m http.server 8000
```

Then open:

```txt
http://localhost:8000
```

## JavaScript Checks

Run these before publishing:

```bash
node --check assets/js/language.js
node --check assets/js/main.js
node --check assets/js/forms.js
node --check assets/js/comments.js
node --check assets/js/questions.js
```

## Deploy With GitHub Pages

This project works on GitHub Pages without a build step.

1. Push the project to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings**.
4. Go to **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch: `main`.
7. Select folder: `/root`.
8. Save.
9. Open the generated GitHub Pages URL.

## Create The GitHub Repository

Recommended repository name:

```txt
centeraha-landing-page
```

If GitHub CLI is installed:

```bash
gh repo create centeraha-landing-page --public --source=. --remote=origin --push
```

If GitHub CLI is not installed:

```bash
git init
git add .
git commit -m "Initial refactor: organize static landing page"
git branch -M main
git remote add origin REPLACE_WITH_GITHUB_REPO_URL
git push -u origin main
```

## Notes For Future Developers

- Keep the project static unless a build step becomes necessary.
- Add new shared text to `assets/js/language.js`.
- Keep page-specific data in its dedicated file: `forms.js`, `comments.js`, or `questions.js`.
- Keep images in `assets/images/`.
- The legacy single-file HTML backup was not present in the publish tree during this GitHub preparation pass. If restored locally, keep it as a reference file or move it to an archive folder before deciding whether it belongs in the repository.
- Placeholder links such as app store URLs, social URLs, legal pages, and the WhatsApp number should be replaced before public launch.

## Refactor Summary

- Split the single-page implementation into separate HTML, CSS, and JavaScript files.
- Added separate clean pages for form, field management, comments, and questions.
- Centralized shared translations for new pages.
- Moved form, comments, and questions data into dedicated JavaScript files.
- Kept the landing page visual design and interactions intact.
- Prepared the project structure for GitHub and GitHub Pages.
