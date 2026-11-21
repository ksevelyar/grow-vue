<template lang="pug">
.grow-logs
  .grow-logs__heading
    .grow-logs__title Logs
    router-link.button(:to="{ name: 'GrowLogNew' }") New log
  .grow-logs__state.grow-logs__state--error(v-if="requestError") {{ requestError }}
  .grow-logs__empty(v-else-if="growLogs.length === 0")
    div No grow logs yet.
    router-link(:to="{ name: 'GrowLogNew' }") Create your first log
  .grow-logs__grid(v-else)
    router-link.grow-logs__card(
      v-for="growLog in growLogs"
      :key="growLog.id"
      :to="{ name: 'GrowLogDetail', params: { log_id: growLog.id } }"
    )
      .grow-logs__thumbnail(:class="{ 'grow-logs__thumbnail--empty': !growLog.thumbnail_url }")
        img(
          v-if="growLog.thumbnail_url"
          :src="getBackendUrl(growLog.thumbnail_url)"
        )
        span.grow-logs__progress(v-if="!growLog.ended_at")
          | {{ getCurrentProgress(growLog.started_at) }}
        .grow-logs__card-details
          span.grow-logs__log-name {{ growLog.name }}
          span.grow-logs__plant-name {{ growLog.plant_name }}
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getBackendUrl } from '@/api/request'
import { calculateGrowLogProgress, getCurrentDate } from '@/time'
import { useUserStore } from '@/stores/user'
import logsClient from '@/api/logs-client'

const userStore = useUserStore()
const growLogs = ref([])
const requestError = ref('')

onMounted(loadGrowLogs)

async function loadGrowLogs() {
  try {
    growLogs.value = await logsClient.list()
  } catch (loadError) {
    requestError.value = loadError.message
  }
}

function getCurrentProgress(startedAt) {
  const userTimezone = userStore.user.timezone
  const currentDate = getCurrentDate(userTimezone)
  const growLogProgress = calculateGrowLogProgress(startedAt, currentDate, userTimezone)

  return `Day ${growLogProgress.dayNumber} · Week ${growLogProgress.weekNumber}`
}
</script>

<style>
.grow-logs {
  width: min(1100px, calc(100vw - 40px));
  margin: 0 auto;
  padding-bottom: 48px;
}

.grow-logs__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.grow-logs__title {
  margin: 0;
  font-weight: normal;
  font-size: 1.5rem;
}

.button {
  background: var(--color-text-muted);
  color: var(--color-contrast);
  padding: 10px 14px;
}

.button:hover {
  background: var(--color-text);
  color: var(--color-contrast);
}

.grow-logs__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(512px, 100%), 1fr));
  gap: 20px;
}

.grow-logs__card {
  width: min(512px, 100%);
  color: inherit;
}

.grow-logs__thumbnail {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-placeholder);
}

.grow-logs__thumbnail--empty {
  background: var(--color-placeholder);
}

.grow-logs__thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grow-logs__progress {
  position: absolute;
  top: 8px;
  left: 8px;
  color: var(--color-contrast);
  background: var(--color-overlay);
  padding: 5px;
  font-size: 0.75rem;
}

.grow-logs__card-details {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
  padding: 24px 12px 12px;
  background: linear-gradient(transparent, var(--color-overlay));
}

.grow-logs__log-name {
  color: var(--color-contrast);
}

.grow-logs__plant-name {
  color: var(--color-contrast);
  font-size: 0.85rem;
}

.grow-logs__state,
.grow-logs__empty {
  padding: 24px;
  background: var(--color-surface);
}

.grow-logs__state--error {
  color: var(--color-error);
}
</style>
