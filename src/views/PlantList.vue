<template lang="pug">
main.plant-list
  .plant-list__heading
    h1.plant-list__title Plants
  p.plant-list__state(v-if="isLoading") Loading plants…
  p.plant-list__state.plant-list__state--error(v-else-if="requestError") {{ requestError }}
  form.plant-list__form(@submit.prevent="savePlant")
    label.plant-list__field
      span(v-if="editingPlantId === null") New plant name
      span(v-else) Plant name
      input(v-model="plantName" required)
      span.plant-list__field-error(v-if="fieldErrors.name") {{ fieldErrors.name }}
    button(type="submit" :disabled="isSaving")
      span(v-if="editingPlantId === null") Create
      span(v-else) Save
    button.plant-list__cancel(
      v-if="editingPlantId !== null"
      type="button"
      :disabled="isSaving"
      @click="clearPlantForm"
    ) Cancel
  p.plant-list__message(v-if="formMessage") {{ formMessage }}
  p.plant-list__state(v-if="plants.length === 0 && !isLoading") No plants yet.
  .plant-list__items(v-else)
    article.plant-list__item(v-for="plant in plants" :key="plant.id")
      router-link.plant-list__link(:to="{ name: 'PlantDetail', params: { plant_id: plant.id } }") {{ plant.name }}
      button.plant-list__edit(type="button" :disabled="isSaving" @click="editPlant(plant)") Edit
      button.plant-list__delete(type="button" :disabled="isSaving" @click="deletePlant(plant)") Delete
      p.plant-list__conflict(v-if="deleteErrors[plant.id]") {{ deleteErrors[plant.id] }}
</template>

<script setup>
import { onMounted, ref } from 'vue'
import plantsClient from '@/api/plants-client'
import { getRequestFieldErrors } from '@/api/request'

const plants = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const requestError = ref('')
const formMessage = ref('')
const fieldErrors = ref({})
const deleteErrors = ref({})
const editingPlantId = ref(null)
const plantName = ref('')

onMounted(loadPlants)

async function loadPlants() {
  isLoading.value = true
  requestError.value = ''
  try {
    plants.value = await plantsClient.list()
  } catch (loadError) {
    requestError.value = loadError.message || 'Unable to load plants'
  } finally {
    isLoading.value = false
  }
}

function editPlant(plant) {
  editingPlantId.value = plant.id
  plantName.value = plant.name
  fieldErrors.value = {}
  formMessage.value = ''
}

function clearPlantForm() {
  editingPlantId.value = null
  plantName.value = ''
  fieldErrors.value = {}
  formMessage.value = ''
}

async function savePlant() {
  const wasEditingPlant = editingPlantId.value !== null
  isSaving.value = true
  fieldErrors.value = {}
  formMessage.value = ''
  try {
    if (wasEditingPlant) {
      await plantsClient.update(editingPlantId.value, { name: plantName.value })
    } else {
      await plantsClient.create({ name: plantName.value })
    }
    clearPlantForm()
    if (wasEditingPlant) {
      formMessage.value = 'Plant updated.'
    } else {
      formMessage.value = 'Plant created.'
    }
    await loadPlants()
  } catch (saveError) {
    fieldErrors.value = getRequestFieldErrors(saveError)
    if (wasEditingPlant) {
      formMessage.value = saveError.message || 'Unable to update plant'
    } else {
      formMessage.value = saveError.message || 'Unable to create plant'
    }
  } finally {
    isSaving.value = false
  }
}

async function deletePlant(plant) {
  deleteErrors.value = { ...deleteErrors.value, [plant.id]: '' }
  try {
    await plantsClient.delete(plant.id)
    await loadPlants()
  } catch (deleteError) {
    let deleteErrorMessage = deleteError.message || 'Unable to delete plant'
    if (deleteError.status === 409) {
      deleteErrorMessage = 'This plant cannot be deleted while it has grow logs.'
    }
    deleteErrors.value = {
      ...deleteErrors.value,
      [plant.id]: deleteErrorMessage,
    }
  }
}
</script>

<style>
.plant-list {
  width: min(900px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.plant-list__title {
  font-weight: normal;
}

.plant-list__form {
  display: flex;
  align-items: end;
  gap: 12px;
}

.plant-list__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.plant-list__field input {
  padding: 9px;
  border: 1px solid var(--color-2);
}

.plant-list__field-error,
.plant-list__conflict,
.plant-list__state--error {
  color: #8b1a1a;
}

.plant-list__items {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
}

.plant-list__item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: var(--color-7);
}

.plant-list__link {
  color: var(--color-4);
}

.plant-list__conflict {
  grid-column: 1 / -1;
}

.plant-list__message,
.plant-list__state {
  padding: 12px;
  background: var(--color-7);
}
</style>
