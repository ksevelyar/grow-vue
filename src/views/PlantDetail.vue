<template lang="pug">
main.plant-detail
  p.plant-detail__state(v-if="isLoading") Loading plant…
  p.plant-detail__state.plant-detail__state--error(v-else-if="requestError") {{ requestError }}
  template(v-else-if="plant")
    h1.plant-detail__title {{ plant.name }}
    form.plant-detail__form(@submit.prevent="renamePlant")
      label.plant-detail__field
        span Plant name
        input(v-model="plantName" required)
        span.plant-detail__field-error(v-if="fieldErrors.name") {{ fieldErrors.name }}
      button(type="submit" :disabled="isSaving") Save name
    p.plant-detail__error(v-if="formError") {{ formError }}
    button.plant-detail__delete(type="button" :disabled="isSaving" @click="deletePlant") Delete
    p.plant-detail__conflict(v-if="deleteError") {{ deleteError }}
    section.plant-detail__logs
      h2 Grow logs
      p.plant-detail__state(v-if="plant.grow_logs.length === 0") This plant has no grow logs.
      ul.plant-detail__log-list(v-else)
        li(v-for="growLog in plant.grow_logs" :key="growLog.id")
          router-link(:to="{ name: 'GrowLogDetail', params: { log_id: growLog.id } }")
            span.plant-detail__log-name {{ growLog.name }}
            span.plant-detail__log-date {{ formatDate(growLog.started_at) }}
            span.plant-detail__log-status {{ getLogStatus(growLog) }}
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import plantsClient from '@/api/plants-client'
import { getRequestFieldErrors } from '@/api/request'
import { formatDate } from '@/time'

const route = useRoute()
const router = useRouter()
const plant = ref(null)
const plantName = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const requestError = ref('')
const formError = ref('')
const fieldErrors = ref({})
const deleteError = ref('')

onMounted(loadPlant)

async function loadPlant() {
  isLoading.value = true
  try {
    plant.value = await plantsClient.get(route.params.plant_id)
    plantName.value = plant.value.name
  } catch (loadError) {
    requestError.value = loadError.message || 'Unable to load plant'
  } finally {
    isLoading.value = false
  }
}

async function renamePlant() {
  isSaving.value = true
  fieldErrors.value = {}
  formError.value = ''
  try {
    await plantsClient.update(route.params.plant_id, { name: plantName.value })
    await loadPlant()
  } catch (renameError) {
    fieldErrors.value = getRequestFieldErrors(renameError)
    formError.value = renameError.message || 'Unable to rename plant'
  } finally {
    isSaving.value = false
  }
}

async function deletePlant() {
  deleteError.value = ''
  try {
    await plantsClient.delete(route.params.plant_id)
    await router.push({ name: 'Plants' })
  } catch (deleteRequestError) {
    if (deleteRequestError.status === 409) {
      deleteError.value = 'This plant cannot be deleted while it has grow logs.'
      return
    }
    deleteError.value = deleteRequestError.message || 'Unable to delete plant'
  }
}

function getLogStatus(growLog) {
  if (growLog.ended_at) {
    return 'Completed'
  }
  return 'Active'
}
</script>

<style>
.plant-detail {
  width: min(900px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.plant-detail__title {
  font-weight: normal;
}

.plant-detail__form {
  display: flex;
  gap: 12px;
  align-items: end;
}

.plant-detail__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.plant-detail__field input {
  padding: 9px;
  border: 1px solid var(--color-2);
}

.plant-detail__field-error,
.plant-detail__error,
.plant-detail__conflict,
.plant-detail__state--error {
  color: #8b1a1a;
}

.plant-detail__logs {
  margin-top: 32px;
}

.plant-detail__log-list {
  list-style: none;
  padding: 0;
}

.plant-detail__log-list li {
  margin: 8px 0;
  background: var(--color-7);
}

.plant-detail__log-list a {
  display: flex;
  justify-content: space-between;
  padding: 12px;
}

.plant-detail__log-name {
  color: var(--color-4);
}

.plant-detail__log-status,
.plant-detail__log-date {
  color: var(--color-1);
}

.plant-detail__state {
  padding: 12px;
  background: var(--color-7);
}
</style>
