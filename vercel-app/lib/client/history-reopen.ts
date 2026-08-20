/**
 * History reopen: skip DeepSeek client fetches that a fresh run would trigger.
 * Set on /history before navigating to /results; consumed once on results load.
 */

export const HISTORY_REOPEN_SKIP_KEY = 'im_history_reopen'

export function markHistoryReopen(): void {
  try {
    sessionStorage.setItem(HISTORY_REOPEN_SKIP_KEY, '1')
  } catch {
    /* sessionStorage optional */
  }
}

/** True when reopen skip was set; consumes the flag. */
export function consumeHistoryReopenSkip(): boolean {
  try {
    if (sessionStorage.getItem(HISTORY_REOPEN_SKIP_KEY) === '1') {
      sessionStorage.removeItem(HISTORY_REOPEN_SKIP_KEY)
      return true
    }
  } catch {
    /* sessionStorage optional */
  }
  return false
}
