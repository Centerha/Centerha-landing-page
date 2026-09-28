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
