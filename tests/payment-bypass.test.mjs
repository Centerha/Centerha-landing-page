import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'

const source = readFileSync(new URL('../assets/js/api.js', import.meta.url), 'utf8')
function fixture() {
  const attributes = new Map()
  const listeners = new Map()
  let response = { paymentBypassForTesting: true }
  let failed = false
  const document = { documentElement: { setAttribute: (key, value) => attributes.set(key, value) }, createElement: () => ({}), head: { appendChild() {} }, visibilityState: 'visible' }
  const window = { CenterhaConfig: { API_BASE_URL: 'https://test.invalid/api' }, addEventListener: (event, callback) => listeners.set(event, callback), dispatchEvent() {}, setInterval() {} }
  vm.runInNewContext(source, { window, document, CustomEvent: class {}, fetch: async () => { if (failed) throw Error('offline'); return { ok: true, json: async () => response } } })
  return { attributes, listeners, setResponse: (value) => { response = value }, fail: () => { failed = true } }
}
const settle = () => new Promise((resolve) => setImmediate(resolve))
test('public prices start hidden, stay hidden ON, become visible only after verified OFF', async () => {
  const f = fixture()
  assert.equal(f.attributes.get('data-customer-prices'), 'hidden')
  await settle()
  assert.equal(f.attributes.get('data-customer-prices'), 'hidden')
  f.setResponse({ paymentBypassForTesting: false })
  f.listeners.get('focus')()
  await settle()
  assert.equal(f.attributes.get('data-customer-prices'), 'visible')
  f.fail()
  f.listeners.get('focus')()
  await settle()
  assert.equal(f.attributes.get('data-customer-prices'), 'hidden')
})
test('missing and nonboolean bypass flags never reveal prices', async () => {
  const f = fixture()
  for (const response of [{}, { paymentBypassForTesting: 'false' }, { paymentBypassForTesting: null }]) {
    f.setResponse(response)
    f.listeners.get('focus')()
    await settle()
    assert.equal(f.attributes.get('data-customer-prices'), 'hidden')
  }
})
