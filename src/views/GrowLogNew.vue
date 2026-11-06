<template lang="pug">
main.grow-log-form-page
  h1.grow-log-form-page__title New grow log
  p.grow-log-form-page__message(v-if="requestError") {{ requestError }}
  p.grow-log-form-page__message(v-if="plantsError") {{ plantsError }}
  p.grow-log-form-page__message(v-if="plants.length === 0 && !isLoadingPlants")
    | Create a plant before starting a grow log.
    router-link(:to="{ name: 'Plants' }")  Manage plants
  p.grow-log-form-page__message(v-if="isLoadingPlants") Loading plants…
  GrowLogForm(
    v-model:form="form"
    :plants="plants"
    :field-errors="fieldErrors"
    :is-saving="isSaving"
    submit-label="Create log"
    :cancel-destination="{ name: 'GrowLogs' }"
    @submit="createGrowLog"
  )
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GrowLogForm from '@/components/GrowLogForm.vue'
import logsClient from '@/api/logs-client'
import plantsClient from '@/api/plants-client'
import { getRequestFieldErrors } from '@/api/request'
import { convertDateToTimestamp } from '@/time'

const router = useRouter()
const plants = ref([])
const isLoadingPlants = ref(true)
const isSaving = ref(false)
const requestError = ref('')
const plantsError = ref('')
const fieldErrors = ref({})
const form = ref({
  name: '',
  plant_id: '',
  started_at: '',
  description: '',
  ended_at: '',
  outcome: '',
})

onMounted(loadPlants)

async function loadPlants() {
  try {
    plants.value = await plantsClient.list()
  } catch (loadError) {
    plantsError.value = loadError.message || 'Unable to load plants'
  } finally {
    isLoadingPlants.value = false
  }
}

async function createGrowLog() {
  isSaving.value = true
  requestError.value = ''
  fieldErrors.value = {}

  try {
    const createdGrowLog = await logsClient.create(createGrowLogPayload())
    await router.push({ name: 'GrowLogDetail', params: { log_id: createdGrowLog.id } })
  } catch (createError) {
    setRequestErrors(createError)
  } finally {
    isSaving.value = false
  }
}

function createGrowLogPayload() {
  let endedAt = null
  if (form.value.ended_at) {
    endedAt = convertDateToTimestamp(form.value.ended_at)
  }
  return {
    plant_id: Number(form.value.plant_id),
    name: form.value.name,
    started_at: convertDateToTimestamp(form.value.started_at),
    description: form.value.description || null,
    ended_at: endedAt,
    outcome: form.value.outcome || null,
  }
}

function setRequestErrors(requestErrorValue) {
  requestError.value = requestErrorValue.message || 'Unable to save grow log'
  fieldErrors.value = getRequestFieldErrors(requestErrorValue)
}
</script>

<style>
.grow-log-form-page {
  width: min(700px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.grow-log-form-page__title {
  font-weight: normal;
}

.grow-log-form-page__message {
  padding: 12px;
  background: var(--color-7);
}
</style>
