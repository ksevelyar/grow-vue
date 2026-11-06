<template lang="pug">
div.grow-logs
  .grow-logs__heading
    h1.grow-logs__title Logs
    router-link.button(:to="{ name: 'GrowLogNew' }") New log
  p.grow-logs__state(v-if="isLoading") Loading logs…
  p.grow-logs__state.grow-logs__state--error(v-else-if="requestError") {{ requestError }}
  .grow-logs__empty(v-else-if="growLogs.length === 0")
    p No grow logs yet.
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
          :alt="`Latest photo for ${growLog.name}`"
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
const isLoading = ref(true)
const requestError = ref('')

onMounted(loadGrowLogs)

async function loadGrowLogs() {
  try {
    growLogs.value = await logsClient.list()
  } catch (loadError) {
    requestError.value = loadError.message || 'Unable to load grow logs'
  } finally {
    isLoading.value = false
  }
}

function getCurrentProgress(startedAt) {
  const userTimezone = userStore.user.timezone || 'UTC'
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
  background: var(--color-4);
  color: #fff;
  padding: 10px 14px;
}

.button:hover {
  background: var(--color-1);
  color: #fff;
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
  background: #808080;
}

.grow-logs__thumbnail--empty {
  background: #b8b8b8;
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
  color: #fff;
  background: rgb(0 0 0 / 65%);
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
  background: linear-gradient(transparent, rgb(0 0 0 / 80%));
}

.grow-logs__log-name {
  color: #fff;
}

.grow-logs__plant-name {
  color: rgb(255 255 255 / 85%);
  font-size: 0.85rem;
}

.grow-logs__state,
.grow-logs__empty {
  padding: 24px;
  background: var(--color-7);
}

.grow-logs__state--error {
  color: #8b1a1a;
}
</style>
