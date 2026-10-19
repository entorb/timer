<script setup lang="ts">
import { mdiMapMarkerAlertOutline, mdiMapMarkerOff, mdiMapMarkerOutline } from "@quasar/extras/mdi-v7"
import { computed } from "vue"
import { t } from "@/shared/i18n"
import { formatDateTime, UNIT_SECONDS } from "@/shared/time"
import { dayMarks, formatDay, hourOf, polar, ringGradient } from "./clock"
import { moonPath, moonPhase } from "./moon"
import { sunTimes } from "./sun"
import { useClock } from "./useClock"
import { useGeo } from "./useGeo"
import { useWeather } from "./useWeather"
import { currentWeather, tempGradient, tempLabels, todayHours, weatherIcon } from "./weather"

// viewBox -125..125: temp band r 76..98 (weather odd hours, temps even), color band r 54..74
// (sun/moon icons) inside it, or on the temp band's place without weather,
// pointer line 44..108, numbers 114
const TEMP_R = 87
const BAND_WIDTH = 22
const BAND_OUTER = 98
const NUMBER_R = 114
// half-sun colors set per <use>: sunset reddish
const SUNRISE_COLORS = { fill: "#fde047", stroke: "#c2410c" }
const SUNSET_COLORS = { fill: "#fb923c", stroke: "#b91c1c" }
// mdi path 24x24 -> ~17 units centered
const WEATHER_FIT = "scale(0.72) translate(-12 -12)"
const HOUR_MS = UNIT_SECONDS.hour * 1000

const now = useClock()
const { coords, place, failed, locate, clear } = useGeo()
const weather = useWeather(coords)
// number: equal value each tick -> dependents recompute only on date change
const today = computed(() => {
  const n = now.value
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12).getTime()
})
const marks = computed(() => {
  const c = place.value
  const sun = sunTimes(new Date(today.value), c.lat, c.lon)
  return sun == null ? dayMarks() : dayMarks(hourOf(sun.sunrise), hourOf(sun.sunset))
})
// current phase, southern hemisphere mirrored
const moon = computed(() => ({
  d: moonPath(moonPhase(new Date(today.value)), 7),
  transform: place.value.lat < 0 ? "scale(-1 1)" : undefined,
}))
// number: changes once per hour -> forecast recomputes hourly
const hourTs = computed(() => Math.floor(now.value.getTime() / HOUR_MS) * HOUR_MS)
const isDay = (hour: number) => hour >= marks.value.sunrise && hour <= marks.value.sunset
const hours = computed(() =>
  weather.value == null ? [] : todayHours(weather.value, hourTs.value),
)
const forecast = computed(() =>
  hours.value
    .filter((h) => h.hour % 2 === 1)
    .map((h) => ({
      transform: `${at(h.hour, TEMP_R)} ${WEATHER_FIT}`,
      d: weatherIcon(h.code, isDay(h.hour)),
    })),
)
// number, minute steps: labels recompute once per minute
const nowHour = computed(() => Math.floor(hourOf(now.value) * 60) / 60)
const temps = computed(() =>
  tempLabels(hours.value, nowHour.value).map((h) => ({
    ...polar(h.hour, TEMP_R),
    temp: `${Math.round(h.temp)}°`,
  })),
)
const tempStyle = computed(() => ({ background: tempGradient(hours.value) }))
const current = computed(() => {
  const c = weather.value == null ? undefined : currentWeather(weather.value, hourTs.value)
  if (c == null) return undefined
  const day = isDay(hourOf(new Date(hourTs.value)))
  return { d: weatherIcon(c.code, day), temp: `${Math.round(c.temp)}°` }
})
const geoIcon = computed(() => {
  if (failed.value) return mdiMapMarkerAlertOutline
  return coords.value == null ? mdiMapMarkerOutline : mdiMapMarkerOff
})
const geoLabel = computed(() => {
  if (failed.value) return t("Location unavailable", "Standort nicht verfügbar")
  return coords.value == null
    ? t(
        "Use my location for sunrise/sunset and weather",
        "Standort für Sonnenauf-/-untergang und Wetter verwenden",
      )
    : t("Delete my location and weather data", "Standort und Wetterdaten löschen")
})
const time = computed(() => formatDateTime(now.value))
const day = computed(() => formatDay(now.value))
const pointer = computed(() => `rotate(${hourOf(now.value) * 15})`)

const at = (hour: number, r: number) => {
  const p = polar(hour, r)
  return `translate(${p.x} ${p.y})`
}
const numbers = Array.from({ length: 12 }, (_, i) => ({ hour: i * 2, ...polar(i * 2, NUMBER_R) }))
const icons = computed((): Array<{ id: string; hour: number; fill?: string; stroke?: string }> => [
  { id: "moon", hour: marks.value.midnight },
  { id: "half-sun", hour: marks.value.sunrise, ...SUNRISE_COLORS },
  { id: "sun", hour: marks.value.noon },
  { id: "half-sun", hour: marks.value.sunset, ...SUNSET_COLORS },
])
// rays as hour positions on a small circle: 8 around, 5 above horizon
const sunRays = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({ a: polar(h, 7), b: polar(h, 10) }))
const halfSunRays = [18, 21, 0, 3, 6].map((h) => ({ a: polar(h, 7), b: polar(h, 10) }))
// color band: inside the temp band; without weather it takes the outer place
const bandOuter = computed(() => (hours.value.length > 0 ? BAND_OUTER - BAND_WIDTH - 2 : BAND_OUTER))
const iconR = computed(() => bandOuter.value - BAND_WIDTH / 2)
// closest-side = 125 units
const percent = (r: number) => `${r / 1.25}%`
const ringStyle = computed(() => ({
  background: ringGradient(marks.value.sunrise, marks.value.sunset),
  "--ring-in": percent(bandOuter.value - BAND_WIDTH),
  "--ring-out": percent(bandOuter.value),
}))
</script>

<template>
  <div class="day-clock relative-position">
    <div
      class="ring absolute-full"
      :style="ringStyle"
    />
    <div
      v-if="hours.length > 0"
      class="temp-ring absolute-full"
      :style="tempStyle"
    />
    <svg
      viewBox="-125 -125 250 250"
      role="img"
      class="absolute-full"
    >
      <title>{{ t("Clock", "Uhr") }} {{ time }}</title>
      <defs>
        <g
          id="moon"
          :transform="moon.transform"
          fill="#f1f5f9"
        >
          <circle
            r="7"
            opacity="0.2"
          />
          <path :d="moon.d" />
        </g>
        <g
          id="sun"
          stroke="#c2410c"
          stroke-width="1.4"
          stroke-linecap="round"
        >
          <line
            v-for="({ a, b }, i) in sunRays"
            :key="i"
            :x1="a.x"
            :y1="a.y"
            :x2="b.x"
            :y2="b.y"
          />
          <circle
            r="5"
            fill="#fde047"
          />
        </g>
        <g
          id="half-sun"
          stroke-width="1.4"
          stroke-linecap="round"
        >
          <g transform="translate(0 2.5)">
            <line
              v-for="({ a, b }, i) in halfSunRays"
              :key="i"
              :x1="a.x"
              :y1="a.y"
              :x2="b.x"
              :y2="b.y"
            />
            <path
              d="M -5 0 A 5 5 0 0 1 5 0 Z"
            />
            <line
              x1="-10"
              x2="10"
            />
          </g>
        </g>
      </defs>

      <use
        v-for="(icon, i) in icons"
        :key="i"
        :href="`#${icon.id}`"
        :transform="at(icon.hour, iconR)"
        :fill="icon.fill"
        :stroke="icon.stroke"
      />

      <g class="on-temp">
        <path
          v-for="(f, i) in forecast"
          :key="i"
          :d="f.d"
          :transform="f.transform"
        />
        <text
          v-for="(e, i) in temps"
          :key="i"
          :x="e.x"
          :y="e.y"
          class="temp-label"
        >
          {{ e.temp }}
        </text>
      </g>
      <!-- HTML flex row: icon + temp centered as one, whatever the text width -->
      <foreignObject
        v-if="current"
        x="-50"
        y="17"
        width="100"
        height="20"
      >
        <div class="weather">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path :d="current.d" />
          </svg>
          {{ current.temp }}
        </div>
      </foreignObject>

      <text
        v-for="n in numbers"
        :key="n.hour"
        :x="n.x"
        :y="n.y"
        class="number"
      >
        {{ n.hour }}
      </text>

      <line
        y1="-44"
        y2="-108"
        :transform="pointer"
        class="pointer"
      />

      <text
        y="2"
        class="time"
      >
        {{ time }}
      </text>
      <text
        y="-22"
        class="day"
      >
        {{ day }}
      </text>
    </svg>
    <q-btn
      id="btn-geo"
      type="button"
      outline
      round
      dense
      class="absolute-top-right"
      :icon="geoIcon"
      :aria-label="geoLabel"
      @click="coords == null ? locate() : clear()"
    />
  </div>
</template>

<style scoped>
.day-clock {
  width: min(80vw, 320px);
  aspect-ratio: 1;
}
/* band edges from --ring-in/--ring-out (percent of closest-side) */
.ring {
  mask: radial-gradient(
    circle closest-side,
    transparent calc(var(--ring-in) - 0.2%),
    #000 var(--ring-in),
    #000 var(--ring-out),
    transparent calc(var(--ring-out) + 0.2%)
  );
}
text {
  fill: currentColor;
  text-anchor: middle;
  dominant-baseline: middle;
  font-variant-numeric: tabular-nums;
}
.number {
  font-size: 11px;
  opacity: 0.7;
}
.time {
  font-size: 24px;
  font-weight: 500;
}
.day {
  font-size: 13px;
  opacity: 0.7;
}
/* temp band 76..98 -> 60.8%..78.4% */
.temp-ring {
  mask: radial-gradient(
    circle closest-side,
    transparent 60.6%,
    #000 60.8%,
    #000 78.4%,
    transparent 78.6%
  );
}
/* pastel band in both themes: dark marks */
.on-temp,
.on-temp text {
  fill: #1e293b;
}
.temp-label {
  font-size: 8px;
  font-weight: 600;
}
/* no opacity/transform/position here: WebKit draws layered foreignObject content at page origin */
.weather {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  height: 100%;
  font-size: 15px;
  line-height: 1;
}
.weather svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}
.pointer {
  stroke: var(--q-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
}
</style>
