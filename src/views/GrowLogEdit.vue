<template lang="pug">
main.grow-log-form-page
  p.grow-log-form-page__message(v-if="isLoading") Loading grow log…
  p.grow-log-form-page__message(v-else-if="loadError") {{ loadError }}
  template(v-else)
    h1.grow-log-form-page__title Edit grow log
    p.grow-log-form-page__message(v-if="plantsError") {{ plantsError }}
    p.grow-log-form-page__error(v-if="requestError") {{ requestError }}
    GrowLogForm(
      v-model:form="form"
      :plants="plants"
      :field-errors="fieldErrors"
      :is-saving="isSaving"
      submit-label="Save log"
      :cancel-destination="{ name: 'GrowLogDetail', params: { log_id: route.params.log_id } }"
      @submit="updateGrowLog"
    )
    button.grow-log-form-page__delete(type="button" :disabled="isDeleting" @click="deleteGrowLog") Delete
    p.grow-log-form-page__error(v-if="deleteError") {{ deleteError }}
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GrowLogForm from '@/components/GrowLogForm.vue'
import logsClient from '@/api/logs-client'
import plantsClient from '@/api/plants-client'
import { getRequestFieldErrors } from '@/api/request'
import { convertDateToTimestamp, convertTimestampToDate } from '@/time'

const route = useRoute()
const router = useRouter()
const plants = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const loadError = ref('')
const requestError = ref('')
const deleteError = ref('')
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

onMounted(loadGrowLog)

async function loadGrowLog() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [loadedGrowLog, loadedPlants] = await Promise.all([
      logsClient.get(route.params.log_id),
      plantsClient.list(),
    ])
    plants.value = loadedPlants
    let endedAtDate = ''
    if (loadedGrowLog.ended_at) {
      endedAtDate = convertTimestampToDate(loadedGrowLog.ended_at)
    }
    Object.assign(form.value, {
      name: loadedGrowLog.name,
      plant_id: loadedGrowLog.plant_id,
      started_at: convertTimestampToDate(loadedGrowLog.started_at),
      description: loadedGrowLog.description || '',
      ended_at: endedAtDate,
      outcome: loadedGrowLog.outcome || '',
    })
  } catch (growLogLoadError) {
    if (growLogLoadError.status) {
      loadError.value = growLogLoadError.message || 'Unable to load grow log'
    } else {
      plantsError.value = growLogLoadError.message || 'Unable to load plants'
    }
  } finally {
    isLoading.value = false
  }
}

async function deleteGrowLog() {
  if (!window.confirm('Delete this grow log and all its entries and photos?')) {
    return
  }
  isDeleting.value = true
  deleteError.value = ''
  try {
    await logsClient.delete(route.params.log_id)
    await router.push({ name: 'GrowLogs' })
  } catch (deletionError) {
    deleteError.value = deletionError.message || 'Unable to delete grow log'
  } finally {
    isDeleting.value = false
  }
}

async function updateGrowLog() {
  isSaving.value = true
  requestError.value = ''
  fieldErrors.value = {}
  try {
    await logsClient.update(route.params.log_id, createGrowLogPayload())
    await router.push({ name: 'GrowLogDetail', params: { log_id: route.params.log_id } })
  } catch (saveError) {
    requestError.value = saveError.message || 'Unable to save grow log'
    fieldErrors.value = getRequestFieldErrors(saveError)
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

.grow-log-form-page__delete {
  margin-top: 18px;
  padding: 10px 14px;
}

.grow-log-form-page__error {
  color: #8b1a1a;
}
</style>
