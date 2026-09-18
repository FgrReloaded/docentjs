---
title: Headless mode
description: Bring your own popover; keep the overlay, spotlight, positioning, and keyboard.
---

When slots are not enough, replace the whole popover. The renderer still draws the overlay and spotlight, positions your container, handles keyboard, focus, and state, and tells you which side it chose.

```ts
createTour(tour, {
  renderer: {
    headless: {
      render(ctx, container) {
        container.innerHTML = ''
        const card = document.createElement('div')
        card.className = 'my-card'
        card.textContent = ctx.step.title ?? ''
        const next = document.createElement('button')
        next.textContent = ctx.isLast ? 'Done' : 'Next'
        next.onclick = ctx.actions.next
        card.append(next)
        container.append(card)
        return () => card.remove()   // cleanup before the next step
      },
    },
  },
})
```

`container` is a light-DOM element the library positions. It carries `data-side` (`top`, `right`, `bottom`, `left`, `center`, or `sheet`) and a `--docent-arrow` custom property with the arrow offset along the cross axis, so you can draw your own arrow:

```css
[data-docent-popover][data-side='bottom'] .my-arrow { top: -6px; left: calc(var(--docent-arrow) - 6px); }
```

The framework adapters build on this: pass a component and they handle the portal or mount for you. See [React](/frameworks/react/), [Vue](/frameworks/vue/), and [Svelte](/frameworks/svelte/).

## What stays with the library

- Overlay and spotlight, including the blocker for non-interactive targets.
- Positioning, flipping, viewport clamping, and the mobile bottom sheet.
- Escape, arrow keys, Tab trapping inside your container, and focus restore.
- Scroll-into-view and occlusion avoidance.
- State, persistence, events, and hooks.
