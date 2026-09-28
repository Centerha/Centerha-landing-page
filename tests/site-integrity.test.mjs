import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteHost = readFileSync(path.join(root, 'CNAME'), 'utf8').trim()

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function htmlFiles(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === '_legacy') return []
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return htmlFiles(absolutePath)
    return entry.isFile() && entry.name.endsWith('.html') ? [absolutePath] : []
  })
}

function getAttribute(html, pattern) {
  return html.match(pattern)?.[1]
}

function translations(language) {
  const source = read('assets/js/language.js')
  const start = source.indexOf(`  ${language}: {`)
  assert.notEqual(start, -1, `${language} translation dictionary exists`)
  const endMarker = language === 'en' ? '  ar: {' : '\n  }\n};'
  const end = source.indexOf(endMarker, start + 1)
  assert.notEqual(end, -1, `${language} translation dictionary is closed`)
  const section = source.slice(start, end)
  return new Map([...section.matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):\s*"([^"]*)"/gm)]
    .map((match) => [match[1], match[2]]))
}

function openingTags(html) {
  return [...html.matchAll(/<[A-Za-z][^<>]*>/g)].map((match) => match[0])
}

function attributes(tag) {
  return new Map([...tag.matchAll(/\s([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']))
}

test('canonical metadata and sitemap use the configured Pages domain', () => {
  for (const relativePath of ['index.html', 'search/index.html', 'field/index.html']) {
    const html = read(relativePath)
    const canonical = getAttribute(html, /<link\s+rel="canonical"[^>]*href="([^"]+)"/i)
    assert.ok(canonical, `${relativePath} has a canonical URL`)
    assert.equal(new URL(canonical).hostname, siteHost, `${relativePath} canonical host`)
  }

  const homeHtml = read('index.html')
  const ogUrl = getAttribute(homeHtml, /<meta\s+property="og:url"\s+content="([^"]+)"/i)
  assert.ok(ogUrl, 'home page has an Open Graph URL')
  assert.equal(new URL(ogUrl).hostname, siteHost)

  const fieldPageScript = read('assets/js/field-page.js')
  const dynamicCanonicalUrls = [...fieldPageScript.matchAll(/(https:\/\/[^/]+\/field\/\?id=)/g)]
  assert.equal(dynamicCanonicalUrls.length, 2, 'both generated field canonicals are present')
  for (const match of dynamicCanonicalUrls) {
    assert.match(match[1], /^https:\/\//, 'generated field canonical uses HTTPS')
    const host = new URL(`${match[1]}test`).hostname
    assert.equal(host, siteHost, 'generated field canonical host')
  }

  const sitemapHosts = [...read('sitemap.xml').matchAll(/<loc>https:\/\/([^/]+)\//g)]
    .map((match) => match[1])
  assert.ok(sitemapHosts.length > 0, 'sitemap contains URLs')
  assert.ok(sitemapHosts.every((host) => host === siteHost), 'all sitemap URLs use CNAME')
  assert.match(
    read('robots.txt'),
    new RegExp(`^Sitemap: https://${siteHost.replaceAll('.', '\\.')}\/sitemap\\.xml$`, 'm'),
  )
})

test('static HTML links resolve to existing pages and fragment targets', () => {
  const failures = []

  for (const absolutePath of htmlFiles()) {
    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/')
    const pageUrl = new URL(relativePath, `https://${siteHost}/`)
    const html = read(relativePath).replace(/<script\b[\s\S]*?<\/script>/gi, '')
    const hrefPattern = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

    for (const match of html.matchAll(hrefPattern)) {
      const href = match[1] ?? match[2] ?? match[3] ?? ''
      if (!href || href === '#') continue
      if (/^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(href)) continue

      const target = new URL(href, pageUrl)
      if (target.hostname !== siteHost) continue

      let targetPath = decodeURIComponent(target.pathname.slice(1))
      if (!targetPath) targetPath = 'index.html'
      if (targetPath.endsWith('/')) targetPath += 'index.html'
      const targetAbsolutePath = path.resolve(root, targetPath)
      if (!targetAbsolutePath.startsWith(`${root}${path.sep}`) || !existsSync(targetAbsolutePath)) {
        failures.push(`${relativePath}: ${href} -> ${targetPath} does not exist`)
        continue
      }

      if (target.hash && targetPath.endsWith('.html')) {
        const targetHtml = read(targetPath)
        const fragment = decodeURIComponent(target.hash.slice(1))
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const idPattern = new RegExp(`\\b(?:id|name)=["']${escaped}["']`)
        if (!idPattern.test(targetHtml)) failures.push(`${relativePath}: ${href} -> missing #${fragment}`)
      }
    }
  }

  assert.deepEqual(failures, [])
})

test('public pages keep bilingual markup and localization keys in parity', () => {
  const english = translations('en')
  const arabic = translations('ar')
  const pages = ['index.html', 'search/index.html', 'field/index.html', 'invite/team/index.html', 'pages/content.html']

  for (const relativePath of pages) {
    const tags = openingTags(read(relativePath)).map(attributes)
    const englishCount = tags.filter((attrs) => attrs.has('data-en')).length
    const arabicCount = tags.filter((attrs) => attrs.has('data-ar')).length
    assert.equal(englishCount, arabicCount, `${relativePath} has matching English and Arabic nodes`)

    for (const attrs of tags) {
      for (const attribute of ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria-label', 'data-i18n-title']) {
        const key = attrs.get(attribute)
        if (!key) continue
        assert.ok(english.has(key), `${relativePath}: ${attribute}=${key} exists in English`)
        assert.ok(arabic.has(key), `${relativePath}: ${attribute}=${key} exists in Arabic`)
      }

      const ariaLabel = attrs.get('aria-label')
      if (ariaLabel && ariaLabel !== 'Centerha') {
        assert.ok(attrs.has('data-i18n-aria-label'), `${relativePath}: aria-label "${ariaLabel}" is localized`)
      }

      const placeholder = attrs.get('placeholder')
      if (placeholder && /[\u0600-\u06ff]/.test(placeholder)) {
        assert.ok(attrs.has('data-i18n-placeholder'), `${relativePath}: Arabic placeholder is localized`)
      }
    }
  }

  assert.equal(english.get('minimumPrice'), 'Minimum')
  assert.equal(english.get('maximumPrice'), 'Maximum')
  assert.equal(arabic.get('minimumPrice'), 'الحد الأدنى')
  assert.equal(arabic.get('maximumPrice'), 'الحد الأعلى')
  assert.equal(english.get('allGovernorates'), 'All governorates')
  assert.equal(english.get('allPitchSizes'), 'All pitch sizes')
  assert.equal(arabic.get('allGovernorates'), 'كل المحافظات')
  assert.equal(arabic.get('allPitchSizes'), 'كل الأنواع')
  assert.match(read('search/index.html'), /id="searchPriceMin"[^>]*data-i18n-placeholder="minimumPrice"/)
  assert.match(read('search/index.html'), /id="searchPriceMax"[^>]*data-i18n-placeholder="maximumPrice"/)
  assert.match(read('index.html'), /data-i18n="allGovernorates"/)
  assert.match(read('index.html'), /data-i18n="allPitchSizes"/)
  assert.match(read('assets/js/language.js'), /lang = lang === 'ar' \? 'ar' : 'en'/)
  assert.match(read('assets/js/language.js'), /\.lang-pill button, \.language-switch button/)
  assert.match(read('invite/team/index.html'), /class="language-switch"[^>]*data-i18n-aria-label="languageSelector"/)
  assert.match(read('assets/js/search-page.js'), /en: "Lowest price", ar: "السعر الأقل"/)
  assert.match(read('assets/js/search-page.js'), /en: "Highest price", ar: "السعر الأعلى"/)
})

test('secondary pages expose a localized mobile navigation disclosure', () => {
  for (const relativePath of ['search/index.html', 'field/index.html', 'pages/content.html']) {
    const html = read(relativePath)
    assert.match(html, /class="page-menu-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="pageNavLinks"/)
    assert.match(html, /<nav class="nav-links" id="pageNavLinks"/)
  }

  const home = read('index.html')
  assert.match(home, /id="mobileMenu"[^>]*role="dialog"[^>]*aria-modal="true"/)
  assert.match(home, /class="faq-q"[^>]*aria-expanded=/)
  assert.match(home, /class="f-col-h"[^>]*aria-expanded=/)
})
