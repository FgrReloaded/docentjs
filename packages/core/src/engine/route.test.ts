import { describe, expect, it } from 'vitest'
import { matchRoute } from './route'

describe('matchRoute', () => {
  it.each([
    ['/settings', '/settings', true],
    ['/settings', '/settings/', true],
    ['/settings', '/settings?tab=billing#top', true],
    ['/settings', '/settings/profile', false],
    ['/', '/', true],
    ['/', '/home', false],
    ['/users/:id', '/users/42', true],
    ['/users/:id', '/users', false],
    ['/users/*', '/users/42', true],
    ['/users/*', '/users/42/edit', false],
    ['/docs/**', '/docs', true],
    ['/docs/**', '/docs/a/b/c', true],
    ['/docs/**', '/api', false],
    ['/**/edit', '/users/42/edit', true],
    ['/**/edit', '/edit', true],
    ['/**', '/anything/at/all', true],
  ])('%s vs %s → %s', (pattern, path, expected) => {
    expect(matchRoute(pattern, path)).toBe(expected)
  })
})
