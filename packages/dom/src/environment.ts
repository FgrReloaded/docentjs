/**
 * Browser implementation of the manager's environment: routes from `location`
 * and navigation events, element presence from the DOM.
 */

import type { DocentEnvironment, Target } from '@docentjs/core'
import { resolveTarget } from './target'

export function createDomEnvironment(doc: Document = document): DocentEnvironment {
  const win = doc.defaultView
  return {
    currentRoute() {
      const loc = win?.location
      return loc ? `${loc.pathname}${loc.search}` : '/'
    },

    onRouteChange(listener) {
      if (!win) return () => {}
      const cleanups: Array<() => void> = []
      for (const type of ['popstate', 'hashchange'] as const) {
        win.addEventListener(type, listener)
        cleanups.push(() => win.removeEventListener(type, listener))
      }
      const nav = (win as { navigation?: EventTarget }).navigation
      if (nav) {
        nav.addEventListener('navigatesuccess', listener)
        cleanups.push(() => nav.removeEventListener('navigatesuccess', listener))
      }
      return () => {
        for (const c of cleanups) c()
      }
    },

    viewportWidth: () => win?.innerWidth,

    onViewportChange(listener) {
      if (!win) return () => {}
      win.addEventListener('resize', listener)
      return () => win.removeEventListener('resize', listener)
    },

    hasTarget: (target: Target) => resolveTarget(target, doc) !== null,

    watchTarget(target, listener) {
      let present = resolveTarget(target, doc) !== null
      if (present) listener()
      let scheduled = false
      const check = () => {
        scheduled = false
        const now = resolveTarget(target, doc) !== null
        if (now && !present) listener()
        present = now
      }
      const observer = new MutationObserver(() => {
        if (scheduled) return
        scheduled = true
        queueMicrotask(check)
      })
      observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true })
      return () => observer.disconnect()
    },
  }
}
