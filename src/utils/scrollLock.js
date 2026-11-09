/**
 * Reference-counted body scroll lock manager.
 * Ensures nested or overlapping modals and slide-over sheets do not accidentally
 * capture "overflow: hidden" as their original state and leave the body permanently frozen.
 */

let lockCount = 0

export function lockScroll() {
  if (typeof document === 'undefined') return
  lockCount++
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
  }
}

export function unlockScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''
  }
}

export function forceResetScroll() {
  if (typeof document === 'undefined') return
  lockCount = 0
  document.body.style.overflow = ''
  document.body.style.overscrollBehavior = ''
}

