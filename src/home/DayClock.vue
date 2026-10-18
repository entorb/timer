<script setup lang="ts">
import { computed } from "vue"
import { t } from "@/shared/i18n"
import { formatDateTime } from "@/shared/time"
import { dayMarks, formatDay, hourOf, polar, ringGradient } from "./clock"
import { useClock } from "./useClock"

// viewBox -125..125: color band r 70..92, pointer 94..104, numbers 114
const ICON_R = 81
const NUMBER_R = 114

const now = useClock()
const marks = dayMarks()
const time = computed(() => formatDateTime(now.value))
const day = computed(() => formatDay(now.value))
const pointer = computed(() => `rotate(${hourOf(now.value) * 15})`)

const at = (hour: number, r: number) => {
  const p = polar(hour, r)
  return `translate(${p.x} ${p.y})`
}
const numbers = Array.from({ length: 12 }, (_, i) => ({ hour: i * 2, ...polar(i * 2, NUMBER_R) }))
const icons = [
  { id: "moon", hour: marks.midnight },
  { id: "half-sun", hour: marks.sunrise },
  { id: "sun", hour: marks.noon },
  { id: "half-sun", hour: marks.sunset },
]
// rays as hour positions on a small circle: 8 around, 5 above horizon
const sunRays = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({ a: polar(h, 7), b: polar(h, 10) }))
const halfSunRays = [18, 21, 0, 3, 6].map((h) => ({ a: polar(h, 7), b: polar(h, 10) }))
const ringStyle = { background: ringGradient() }
</script>

<template>
  <div class="day-clock relative-position">
    <div
      class="ring absolute-full"
      :style="ringStyle"
    />
    <svg
      viewBox="-125 -125 250 250"
      role="img"
      class="absolute-full"
    >
      <title>{{ t("Clock", "Uhr") }} {{ time }}</title>
      <defs>
        <path
          id="moon"
          d="M 3 -6.32 A 7 7 0 1 0 3 6.32 A 6.5 6.5 0 0 1 3 -6.32 Z"
          transform="rotate(-20)"
          fill="#f1f5f9"
        />
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
          stroke="#c2410c"
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
              fill="#fde047"
            />
            <line
              x1="-10"
              x2="10"
            />
          </g>
        </g>
      </defs>

      <use
        v-for="icon in icons"
        :key="icon.hour"
        :href="`#${icon.id}`"
        :transform="at(icon.hour, ICON_R)"
      />

      <text
        v-for="n in numbers"
        :key="n.hour"
        :x="n.x"
        :y="n.y"
        class="number"
      >
        {{ n.hour }}
      </text>

      <path
        d="M 0 -94 L -5.5 -104 L 5.5 -104 Z"
        :transform="pointer"
        class="pointer"
      />

      <text
        y="4"
        class="time"
      >
        {{ time }}
      </text>
      <text
        y="26"
        class="day"
      >
        {{ day }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.day-clock {
  width: min(80vw, 320px);
  aspect-ratio: 1;
}
/* closest-side = 125 units: band 70..92 -> 56%..73.6% */
.ring {
  mask: radial-gradient(
    circle closest-side,
    transparent 55.8%,
    #000 56%,
    #000 73.6%,
    transparent 73.8%
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
  font-size: 26px;
  font-weight: 500;
}
.day {
  font-size: 9px;
  opacity: 0.7;
}
.pointer {
  fill: var(--q-primary);
}
</style>
