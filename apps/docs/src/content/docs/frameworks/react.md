---
title: React
description: Hooks, a component, and a provider for React 18 and 19.
---

```sh
pnpm add @docentjs/react
```

This is the only package a React app needs. It also exports `defineTour`, the tour and step types such as `RenderContext`, and `createLocalStorage`, and the theme presets come from `@docentjs/react/themes`.
The tour definition type is exported as `TourDefinition`, because `Tour` is the component.

## `useTour`

```tsx
import { useTour } from '@docentjs/react'
import { welcomeTour } from './tours'

function Dashboard() {
  const tour = useTour(welcomeTour)
  return (
    <>
      <button onClick={() => tour.start()}>Take the tour</button>
      <p>Status: {tour.state.status}</p>
    </>
  )
}
```

The controller is created once and destroyed when the component unmounts. It is recreated only when the tour id or version changes, so define tours outside the component or memoize them.

## Custom popover

Pass a render function. It is portalled into the container the library positions, so context, hooks, and your CSS all work. Render `tour.portal` once anywhere in your tree.

```tsx
function Card({ ctx }: { ctx: RenderContext }) {
  return (
    <div className="card">
      <h3>{ctx.step.title}</h3>
      <button onClick={ctx.actions.next}>{ctx.isLast ? 'Done' : 'Next'}</button>
    </div>
  )
}

function Dashboard() {
  const tour = useTour(welcomeTour, { popover: (ctx) => <Card ctx={ctx} /> })
  return (
    <>
      <button onClick={() => tour.start()}>Start</button>
      {tour.portal}
    </>
  )
}
```

## `<Tour>`

The component form renders the portal for you and hands the controls to a render prop. `autoStart` starts on mount; `'resume'` continues from persisted progress.

```tsx
<Tour tour={welcomeTour} autoStart="resume" popover={(ctx) => <Card ctx={ctx} />}>
  {(t) => <button onClick={() => t.skip()}>Skip</button>}
</Tour>
```

## `<DocentProvider>`

Share renderer defaults, identity, storage, and sink with every tour below.

```tsx
<DocentProvider
  renderer={{ theme: minimal, templates: { card } }}
  identity={{ id: user.id, traits: { plan: user.plan } }}
  sink={{ emit: (e) => analytics.track(e.type, e) }}
>
  <App />
</DocentProvider>
```

## Many tours: `useDocent`

```tsx
const docent = useDocent({ tours: [welcome, invoices], popover: (ctx) => <Card ctx={ctx} /> })

useEffect(() => {
  if (user) docent.identify(user.id, { plan: user.plan })
}, [user])

return <>{docent.portal}</>
```

The manager starts tours from their triggers, conditions, and frequency. `docent.state.active` is the running tour. See [Tour manager](/guides/manager/).
