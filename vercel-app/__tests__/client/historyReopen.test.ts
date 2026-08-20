/**
 * History reopen skip flag: no DeepSeek spend on authenticated reopen.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  HISTORY_REOPEN_SKIP_KEY,
  consumeHistoryReopenSkip,
  markHistoryReopen,
} from '@/lib/client/history-reopen'

function mockSessionStorage() {
  const store = new Map<string, string>()
  const ss = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
  }
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: ss,
    configurable: true,
    writable: true,
  })
  return store
}

describe('history reopen skip', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).sessionStorage
  })

  it('markHistoryReopen sets the session flag', () => {
    const store = mockSessionStorage()
    markHistoryReopen()
    expect(store.get(HISTORY_REOPEN_SKIP_KEY)).toBe('1')
  })

  it('consumeHistoryReopenSkip returns false when unset', () => {
    mockSessionStorage()
    expect(consumeHistoryReopenSkip()).toBe(false)
  })

  it('consumeHistoryReopenSkip returns true once and clears the flag', () => {
    const store = mockSessionStorage()
    markHistoryReopen()
    expect(consumeHistoryReopenSkip()).toBe(true)
    expect(store.has(HISTORY_REOPEN_SKIP_KEY)).toBe(false)
    expect(consumeHistoryReopenSkip()).toBe(false)
  })
})

describe('source guards: history reopen wiring', () => {
  const root = join(__dirname, '../..')

  it('history page marks reopen before navigating to results', () => {
    const page = readFileSync(join(root, 'app/history/page.tsx'), 'utf8')
    expect(page).toMatch(/markHistoryReopen\(\)/)
    expect(page).toMatch(/@\/lib\/client\/history-reopen/)
    expect(page).not.toMatch(/im_history_reopen/)
  })

  it('results page consumes reopen skip before patient-profiles fetch', () => {
    const page = readFileSync(join(root, 'app/results/page.tsx'), 'utf8')
    expect(page).toMatch(/consumeHistoryReopenSkip\(\)/)
    expect(page).toMatch(/@\/lib\/client\/history-reopen/)
    expect(page).not.toMatch(/im_history_reopen/)
    const skipAt = page.indexOf('consumeHistoryReopenSkip()')
    const fetchAt = page.indexOf("fetch('/api/patient-profiles'")
    expect(skipAt).toBeGreaterThan(0)
    expect(fetchAt).toBeGreaterThan(skipAt)
  })
})
