# Timer App - AI Coding Guidelines

Vue 3 + Quasar + TypeScript SPA (Vite, pnpm). No backend; state persists in `localStorage`.

**Keep this file current:** when you learn something non-obvious about this repo (new lint trap, convention, gotcha, changed command or structure), update this file in the same task. Keep it short, delete outdated lines.

## Layout

```text
src/
  router.ts          # tabs (path, name, nameDe, desc, descDe, icon, lazy page) = app navigation
  App.vue            # shell: tabs, lang/dark toggle, info dialog
  home/HomePage.vue  # start page `/`: running list (running.ts + useRunning.ts: reads via the sub-apps' pure `load*` functions, no feature composables → no sounds; pages are `keep-alive`, so it re-reads in `onActivated`, finished countdowns stay at 0:00 until next visit; anticipation events, ETAs, timers, stopwatches...) above `tabs`; DayClock (24h ring, clock.ts, tick from `shared/useClock` passed as prop; sunrise/sunset: sun.ts + useGeo.ts, coords in `tmr-geo`, sun/moon use Erlangen until user shares position (`place` in useGeo; weather only for own `coords`), geo button toggles locate/delete (deleting also drops weather); moon phase: moon.ts; weather: outer temp ring (color relative to day range, temps at even hours from 3h ago, icons at odd; sun ring moves inside it, takes outer place without weather), weather.ts + useWeather.ts, Open-Meteo, cache `tmr-weather` 1h) + `tabs` with desc (use cases)
  shared/            # i18n (t, lang), feedback (sound/vibrate), confirm (confirmDialog), DeleteAllButton, useClock (`now` timestamp tick: `ms`, `active`, `onTick`; aligned to full seconds; without `onTick` paused while its KeepAlive page is hidden), ListSelect (switch/rename/add/delete named items) + `list.ts` `pickById` (selected or first), ProgressRing, stats, storage, time, useWakeLock
  <feature>/         # anticipation, workout, eta, multitimer, stopwatch, meeting, pomodoro
    <Feature>Page.vue  # view, dumb
    use<Feature>.ts    # composable: refs, persistence, timers
    <feature>.ts       # pure logic (no Vue), unit tested
    __tests__/*.spec.ts
e2e/                 # Playwright specs + helper-e2e.ts; screens.ts = screenshot export (not a spec)
scripts/             # checks, see below
```

New feature = new folder with the same split + entry in `tabs` in `src/router.ts`. Order of `tabs` = order in dropdown and start page; `desc`/`descDe` (short use cases) shown on start page, keep them current when a feature changes. Feature added/removed/reordered → also update manifest name/description in `vite.config.ts`, `<meta description/keywords>` in `index.html`, Features list in `README.md`.

## Commands

| Task                                                     | Command                           |
| -------------------------------------------------------- | --------------------------------- |
| After each task: format + lint (biome, autofixes)        | `scripts/chk_js_format.sh`        |
| After each feature: all checks (`chk_*.sh`)              | `scripts/run_checks.sh`           |
| Unit tests only                                          | `scripts/chk_js_test.sh`          |
| Types only                                               | `scripts/chk_js_types.sh`         |
| E2E (starts dev server)                                  | `scripts/run_e2e.sh`              |
| Screenshots per sub-app (mobile) → `tmp/screens/<lang>/` | `scripts/run_screens.sh [en\|de]` |

Scripts print `OK` on success, else first 100 lines of errors. Fix and rerun only the failing one.

## Reuse across features

Before writing a helper/constant/component, grep `src/shared` and the other features; share instead of copy. Second copy → move to `shared/` (or export from the owning feature).

- Persistence lives in the pure `<feature>.ts`: exported `KEY_*`, `ORIGIN` (stats), `load*()` (with defaults). Composables and `home/useRunning.ts` call these, never `readJson("tmr-...")` with literal keys.
- `statsWrite(ORIGIN)` and `<StatsLine :origin="ORIGIN" />`, no literal origins.
- Time constants: `MINUTE_MS`, `HOUR_MS`, `DAY_MS`, `UNIT_SECONDS` from `@/shared/time`, no `60_000` / `86_400` literals. Date helpers (`isoDay`, `hhmm`, `pad`, `formatClock`, ...) there too.
- Every tick via `useClock({ ms, active, onTick })` (gate with `active` so paused pages don't re-render; sounds in `onTick`), never a raw `setInterval`. Default 1s; sub-second only stopwatch with tenths. Timestamps from user actions via `nowSec()` (whole seconds), raw `Date.now()` only in stopwatch. ETA `addRow` rounds too, same second replaces the last row (zero time delta = no speed).
- Phase labels/colors (`PHASES`) exported from `use<Feature>.ts`, reused by home.

Stats writes while offline are queued in `tmr-stats-pending`, `statsFlush()` sends them at app start (`main.ts`) and after the next successful write; no fetch when `!navigator.onLine`. `statsWrite`/`statsFlush` are async but never reject: call them as `void statsWrite(ORIGIN)`.

Only network calls: `shared/stats.ts`, `home/useWeather.ts`, Sentry, Matomo (`index.html`), SW update. Each skips when `!navigator.onLine` (offline fetch makes mobile OS prompt for wifi); Sentry/Matomo not initialized when app starts offline.

`meeting` builds on `stopwatch/stopwatch.ts` (start/stop/elapsed, resume shifts `start`). localStorage keys prefixed `tmr-`, dark+lang in one `tmr-settings` key; stats origin per sub-app: `tmr-eta|mt|ant|sw|pomo|wo|mm`, same footer via `StatsLine` (prop `origin` only). New origin must be whitelisted on stats server (`entorb.net/web-stats-json.php`), else not counted.

`workout`: prepare fixed (5s); create/edit via dialog (work/rest/reps, empty name → `autoName` e.g. `180/30x4`); select order = last start, newest first (`touchWorkout` only in `toggle`, not on select).

`anticipation` (Vorfreude): display-only countdowns to dates (past dates count up), no sound/wake lock, reuses `clearName` from `multitimer/timers.ts`.

`eta`: multiple data sets in `tmr-eta-sets` (+ `tmr-eta-selected`), pure set model in `eta/sets.ts`; bell + wake lock cover all sets, display only the selected one. Sets rarely used: `ListSelect` shown only with 2+ sets.

## i18n

UI is bilingual EN/DE via inline helper, no translation files:

```typescript
import { t } from "@/shared/i18n"
t("Close", "Schließen") // reactive in templates / computed
```

Every user-visible string (labels, `aria-label`, errors) needs both languages. Route names: `name` + `nameDe` in `router.ts`.

## Logic split

- Pure functions in `<feature>.ts`: take state + `now` timestamp, return new state. No `Date.now()`, no Vue, no DOM → easy unit tests.
- Composable `use<Feature>.ts` wires refs, `watch` → `localStorage`, tick via `useClock`, `useWakeLock`, `playSound`.
- Timers store end timestamps (`endTs`), not decrementing counters; derive remaining from `now`.
- Sounds: all synthesized (Web Audio) in `src/shared/feedback.ts` (`SOUNDS`, `playSound`), no audio files. Review in dev: `/timer/review-audio.html` (root html, not a build input).
- Background (hidden page): intervals get frozen, so each sound-making composable registers `useBackgroundSounds(() => [{ ts, sound }])` (scheduled on audio clock at hide) and its tick skips events due while hidden via `dueInBackground(dueTs)` (no late sounds on return). Every sound-making composable also has `useWakeLock`.
- PWA: `registerSW` from `virtual:pwa-register` in `main.ts` (needs `workbox-window` dep). `registerType: prompt`: confirm dialog on new SW (`onNeedRefresh`) before reload; `router.onError` reloads on stale lazy chunk.
- Browser-only side effects untestable in vitest: mark `/* c8 ignore next N */`.

## Composables

Return minimal interface, mutate returned refs directly (no setters):

```typescript
// ✅ DO
pomodoro.settings.value.focus = 30

// ❌ DON'T
function setFocus(value: number) {
  settings.value.focus = value
}
```

One responsibility per composable. No helper for one-liners.

## Views

Keep `.vue` dumb: template + `computed` glue only, logic in composable / pure module.

SVG `foreignObject` (DayClock center weather): no `opacity`/`transform`/`position` on its HTML, iOS Safari then draws it at page top-left.

## Error Handling

- Catch only where you handle. No `console.error/warn`. Swallowed errors → `Sentry.captureException(e)` / `captureMessage(..., "warning")`, uncaught ones Sentry catches itself. Not reported: user choices (geolocation denied, also iOS PWA without Safari permission; share cancel), offline fetch, wake lock, stats.
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

| Rule                                     | Trigger                                   | Fix                                                            |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `vue/no-boolean-default`                 | `withDefaults(props, { boolProp: true })` | Omit from `withDefaults`, use `?? true` at call site           |
| `noNonNullAssertion` (biome)             | `foo!.bar`                                | `foo?.bar ?? fallback`                                         |
| `noExcessiveCognitiveComplexity` (biome) | function score > 15                       | Extract helpers, reduce nesting, simplify ternaries            |
| `Object is possibly 'undefined'` (TS)    | `arr[i]` after guard                      | `arr[i]?.prop ?? fallback`, `arr.at(-1)`                       |
| `typescript:S6582` (sonar)               | `a == null \|\| a.x !== y`                | `a?.x !== y \|\| a.y ...` (TS narrows after the first operand) |
| `typescript:S3358` (sonar)               | nested ternary                            | `if`/early returns                                             |
| `typescript:S7755` (sonar)               | `arr[arr.length - 1]`                     | `arr.at(-1)`                                                   |
| `typescript:S1135` (sonar)               | `TODO` comment                            | word it "Remove after ..." instead                             |
| `typescript:S9383` (sonar)               | unawaited promise call                    | `void promise` if it never rejects, else `await` / `.catch`    |
| `css:S9423` (sonar)                      | `!important`                              | resolve specificity; inline styles (Quasar) cannot be overridden without it, drop the override (NOSONAR does not suppress css) |
| cspell                                   | new word in code/comments                 | add to `cspell-words.txt`                                      |

## Checklist

- [ ] Pure logic in `<feature>.ts` with unit test, composable for wiring, view dumb
- [ ] Direct ref mutations, no setters
- [ ] All UI strings via `t(en, de)`
- [ ] No `!` assertions, no console logging in catch
- [ ] Buttons `type` + icon buttons `aria-label`
- [ ] `scripts/chk_js_format.sh` passes (feature done: `scripts/run_checks.sh`)
- [ ] Learned something non-obvious? Update this file
