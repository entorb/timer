# Timer

[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=entorb_timer&metric=ncloc)](https://sonarcloud.io/summary/overall?id=entorb_timer)
[![Security issues](https://sonarcloud.io/api/project_badges/measure?project=entorb_timer&metric=software_quality_security_issues)](https://sonarcloud.io/summary/overall?id=entorb_timer)

Mobile-optimized PWA timer toolbox, built with [Vue.js](https://vuejs.org) and [Quasar](https://quasar.dev).

Hosted at [entorb.net/timer/](https://entorb.net/timer/). [Feedback](https://entorb.net/contact.php?origin=timer) is highly appreciated.

## Features

- **ETA**: calculate remaining (waiting) time / estimated time of arrival via (weighted) linear regression. Port of [eta-vue](https://github.com/entorb/eta-vue).
- **Multi-Timer**: several named countdowns at once, with alarm. Recently used timers as quick chips. Port of [entorb.net-apps/multitimer](https://github.com/entorb/entorb.net-apps/tree/main/multitimer).
- **Stopwatch**: lap times for multiple athletes. Common start ("Start all") or individual start by tapping a tile. Tap again records a lap. Shows lap count, current, last and best lap, lap table, CSV export.
- **Pomodoro**: 25 min focus, 5 min short break, 15 min long break after 4 rounds (configurable), auto-advance with sound.

All data stays in the browser's localStorage. ETA and Multi-Timer use the same storage keys as their predecessors, so existing data on entorb.net is kept.

## Build and Run this Project Locally

```sh
pnpm install
pnpm run dev
```

All sounds are synthesized via Web Audio in `src/shared/feedback.ts` (no audio files). Review them in dev mode at [localhost:5173/timer/review-audio.html](http://localhost:5173/timer/review-audio.html).

## Code Checks

- `./scripts/run_checks.sh`
- `pnpm exec playwright install chromium && ./scripts/run_e2e.sh`
- `./scripts/run_spelling.sh`
- [SonarQube](https://sonarcloud.io/summary/overall?id=entorb_timer)

[![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-light.svg)](https://sonarcloud.io/summary/overall?id=entorb_timer)
