# @docentjs/react

React bindings for [Docent](https://github.com/FgrReloaded/docentjs), a guided product tour library. React 18 and 19.

```sh
pnpm add @docentjs/react
```

```tsx
import { useTour } from '@docentjs/react'
import { welcomeTour } from './tours'

function Dashboard() {
  const tour = useTour(welcomeTour)
  return <button onClick={() => tour.start()}>Take the tour</button>
}
```

## Your own popover

```tsx
const tour = useTour(welcomeTour, { popover: (ctx) => <Card ctx={ctx} /> })
// render {tour.portal} once anywhere in your tree
```

The component is portalled into a container the library positions, so context, hooks and CSS all work. The library keeps the overlay, spotlight, keyboard and focus handling.

## Many tours

```tsx
const docent = useDocent({ tours: [welcome, invoices] })
useEffect(() => void docent.identify(user.id, { plan: user.plan }), [user])
```

Tours start from their own triggers, conditions and frequency.

## Also

- `<Tour tour autoStart popover>{(t) => …}</Tour>` component form.
- `<DocentProvider renderer identity storage sink>` to share defaults.

MIT
