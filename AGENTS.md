# Timer App - AI Coding Guidelines

Vue 3 + Quasar + TypeScript SPA (Vite, pnpm). No backend; state persists in `localStorage`.

**Keep this file current:** when you learn something non-obvious about this repo (new lint trap, convention, gotcha, changed command or structure), update this file in the same task. Keep it short, delete outdated lines.

## Layout

```text
src/
  router.ts          # tabs (path, name, nameDe, desc, descDe, icon, lazy page) = app navigation
  App.vue            # shell: tabs, lang/dark toggle, info dialog
  home/HomePage.vue  # start page `/`: DayClock (24h ring, clock.ts + useClock.ts; sunrise/sunset: sun.ts + useGeo.ts, coords in `tmr-geo`, geo button toggles locate/delete (deleting also drops weather); moon phase: moon.ts; weather: inner temp ring (color, temps at even hours from 1h ago, icons at odd), weather.ts + useWeather.ts, Open-Meteo, cache `tmr-weather` 1h) + `tabs` with desc (use cases)
  shared/            # i18n (t, lang), feedback (sound/vibrate), confirm (confirmDialog), ProgressRing, stats, storage, time, useWakeLock
  <feature>/         # eta, multitimer, pomodoro, stopwatch, workout, meeting
    <Feature>Page.vue  # view, dumb
    use<Feature>.ts    # composable: refs, persistence, timers
    <feature>.ts       # pure logic (no Vue), unit tested
    __tests__/*.spec.ts
e2e/                 # Playwright specs + helper-e2e.ts; screens.ts = screenshot export (not a spec)
scripts/             # checks, see below
```

New feature = new folder with the same split + entry in `tabs` in `src/router.ts`. Order of `tabs` = order in dropdown and start page; `desc`/`descDe` (short use cases) shown on start page, keep them current when a feature changes.

## Commands

| Task | Command |
| ---- | ------- |
| After each task: format + lint (biome, autofixes) | `scripts/chk_js_format.sh` |
| After each feature: all checks (`chk_*.sh`) | `scripts/run_checks.sh` |
| Unit tests only | `scripts/chk_js_test.sh` |
| Types only | `scripts/chk_js_types.sh` |
| E2E (starts dev server) | `scripts/run_e2e.sh` |
| Screenshots per sub-app (mobile) → `tmp/screens/<lang>/` | `scripts/run_screens.sh [en\|de]` |

Scripts print `OK` on success, else first 100 lines of errors. Fix and rerun only the failing one.

## Reuse across features

Only network calls: `shared/stats.ts`, `home/useWeather.ts`.

`meeting` builds on `stopwatch/stopwatch.ts` (start/stop/elapsed, resume shifts `start`). localStorage keys prefixed `tmr-`, dark+lang in one `tmr-settings` key; stats origin per sub-app: `tmr-eta|mt|sw|pomo|wo|mm`, same footer via `StatsLine` (prop `origin` only).

## i18n

UI is bilingual EN/DE via inline helper, no translation files:

```typescript
import { t } from "@/shared/i18n"
t("Close", "Schließen") // reactive in templates / computed
```

Every user-visible string (labels, `aria-label`, errors) needs both languages. Route names: `name` + `nameDe` in `router.ts`.

## Logic split

- Pure functions in `<feature>.ts`: take state + `now` timestamp, return new state. No `Date.now()`, no Vue, no DOM → easy unit tests.
- Composable `use<Feature>.ts` wires refs, `watch` → `localStorage`, intervals (`onScopeDispose` cleanup), `useWakeLock`, `playSound`.
- Timers store end timestamps (`endTs`), not decrementing counters; derive remaining from `now`.
- Sounds: all synthesized (Web Audio) in `src/shared/feedback.ts` (`SOUNDS`, `playSound`), no audio files. Review in dev: `/timer/review-audio.html` (root html, not a build input).
- Background (hidden page): intervals get frozen, so each sound-making composable registers `useBackgroundSounds(() => [{ ts, sound }])` (scheduled on audio clock at hide) and its tick skips events due while hidden via `dueInBackground(dueTs)` (no late sounds on return). Every sound-making composable also has `useWakeLock`.
- PWA: `registerSW` from `virtual:pwa-register` in `main.ts` (needs `workbox-window` dep). autoUpdate reloads page on new SW; `router.onError` reloads on stale lazy chunk.
- Browser-only side effects untestable in vitest: mark `/* c8 ignore next N */`.

## Composables

Return minimal interface, mutate returned refs directly (no setters):

```typescript
// ✅ DO
pomodoro.settings.value.focus = 30

// ❌ DON'T
function setFocus(value: number) { settings.value.focus = value }
```

One responsibility per composable. No helper for one-liners.

## Views

Keep `.vue` dumb: template + `computed` glue only, logic in composable / pure module.

SVG `foreignObject` (DayClock center weather): no `opacity`/`transform`/`position` on its HTML, iOS Safari then draws it at page top-left.

## Error Handling

- Catch only where you handle. No `console.error/warn`.
- `localStorage` access: via `readJson` / `writeJson` from `@/shared/storage` (catch private mode, quota, corrupt JSON). Persist with `watch(ref, (v) => writeJson(KEY_*, v))`.
- Derived values (e.g. speed per row) as `computed`, not stored in state.
- User-facing errors via `t(en, de)`.

## TypeScript

- `==`/`!=` null checks, `?.`, `??`. Never `!` non-null assertions.
- Types PascalCase, no `I` prefix.
- Style (biome): double quotes, no semicolons, imports via `@/` alias.
- Format on save drops unused imports: add usage first, then import.

## Code Quality

- Cognitive complexity < 15.
- Repeated strings (4+) → constants. `localStorage` keys as `KEY_*` constants.
- Reuse `@/shared/time`: `Unit` + `UNIT_SECONDS`, `parseDecimal` (user number input, accepts `,`), `formatDateTime` (always German format), `formatClock`, `secondsToString`.
- Buttons need `type`; icon-only buttons need `aria-label`; inputs need labels.

## Lint traps

| Rule | Trigger | Fix |
| ---- | ------- | --- |
| `vue/no-boolean-default` | `withDefaults(props, { boolProp: true })` | Omit from `withDefaults`, use `?? true` at call site |
| `noNonNullAssertion` (biome) | `foo!.bar` | `foo?.bar ?? fallback` |
| `noExcessiveCognitiveComplexity` (biome) | function score > 15 | Extract helpers, reduce nesting, simplify ternaries |
| `Object is possibly 'undefined'` (TS) | `arr[i]` after guard | `arr[i]?.prop ?? fallback`, `arr.at(-1)` |
| `typescript:S6582` (sonar) | `a == null \|\| a.x !== y` | `a?.x !== y \|\| a.y ...` (TS narrows after the first operand) |
| cspell | new word in code/comments | add to `cspell-words.txt` |

## Checklist

- [ ] Pure logic in `<feature>.ts` with unit test, composable for wiring, view dumb
- [ ] Direct ref mutations, no setters
- [ ] All UI strings via `t(en, de)`
- [ ] No `!` assertions, no console logging in catch
- [ ] Buttons `type` + icon buttons `aria-label`
- [ ] `scripts/chk_js_format.sh` passes (feature done: `scripts/run_checks.sh`)
- [ ] Learned something non-obvious? Update this file
