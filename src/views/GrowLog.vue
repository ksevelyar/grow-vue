<template lang="pug">
div.grow-log
  p.grow-log__state(v-if="isLoading") Loading grow log…
  p.grow-log__state.grow-log__state--error(v-else-if="requestError && !growLog") {{ requestError }}
  template(v-else-if="growLog")
    .grow-log__heading
      h1.grow-log__title {{ growLog.name }}
      router-link.grow-log__edit(:to="{ name: 'GrowLogEdit', params: { log_id: growLog.id } }") Edit log
    .grow-log__summary
      .grow-log__summary-field
        span.grow-log__summary-label Plant
        span {{ growLog.plant_name }}
      .grow-log__summary-field
        span.grow-log__summary-label Start date
        span {{ formatDate(growLog.started_at) }}
      .grow-log__summary-field
        span.grow-log__summary-label Description
        span.grow-log__summary-value {{ growLog.description || 'No description.' }}
      .grow-log__summary-field
        span.grow-log__summary-label End date
        span(v-if="growLog.ended_at") {{ formatDate(growLog.ended_at) }}
        span(v-else) Ongoing
      .grow-log__summary-field
        span.grow-log__summary-label Outcome
        span.grow-log__summary-value {{ growLog.outcome || 'No outcome yet.' }}
    Gallery(ref="photoGallery" :photos="allPhotos")
    div.grow-log__report
      h2.grow-log__section-title {{ reportTitle }}
      form.grow-log__report-form(@submit.prevent="saveReport")
        label.grow-log__field
          span Date
          input(v-model="entryForm.occurred_at" type="date" required)
          span.grow-log__field-error(v-if="fieldErrors.occurred_at") {{ fieldErrors.occurred_at }}
        label.grow-log__field
          span Stage
          select(v-model="entryForm.stage" required)
            option(value="" disabled) Select a stage
            option(v-for="stage in stages" :key="stage" :value="stage") {{ stage }}
          span.grow-log__field-error(v-if="fieldErrors.stage") {{ fieldErrors.stage }}
        label.grow-log__field.grow-log__field--wide
          span Description
          textarea(v-model="entryForm.description")
        label.grow-log__field.grow-log__field--wide
          span Photos
          input(ref="photoFileInput" type="file" accept="image/*" multiple @change="selectPhotos")
        .grow-log__photos.grow-log__field--wide(v-if="selectedReportEntry && selectedReportEntry.photos.length")
          figure.grow-log__photo(v-for="photo in selectedReportEntry.photos" :key="photo.id")
            img(:src="getBackendUrl(photo.thumbnail_url)" :alt="photo.original_filename || 'Grow log photo'")
            button(type="button" @click="deletePhoto(photo)") Remove photo
        p.grow-log__photo-errors.grow-log__field--wide(v-if="photoUploadErrors.length")
          span(v-for="uploadError in photoUploadErrors" :key="uploadError") {{ uploadError }}
        p.grow-log__error.grow-log__field--wide(v-if="requestError") {{ requestError }}
        .grow-log__form-actions.grow-log__field--wide
          button(type="submit" :disabled="isSavingEntry") {{ reportActionLabel }}
    div.grow-log__entries
      h2.grow-log__section-title Log entries
      p.grow-log__state(v-if="growLog.entries.length === 0") No entries yet.
      .grow-log__entry-list(v-else)
        article.grow-log__entry(v-for="entry in growLog.entries" :key="entry.id")
          .grow-log__entry-heading
            h3.grow-log__entry-title {{ formatEntryTitle(entry) }}
            .grow-log__entry-actions
              button.grow-log__entry-edit(type="button" @click="editEntry(entry)") Edit
              button.grow-log__entry-delete(type="button" @click="deleteEntry(entry)") Delete
          p.grow-log__entry-description(v-if="entry.description") {{ entry.description }}
          .grow-log__photos(v-if="entry.photos.length")
            button.grow-log__photo.grow-log__entry-photo(
              v-for="(photo, photoIndex) in entry.photos"
              :key="photo.id"
              type="button"
              :aria-label="`Open photo ${photoIndex + 1} from ${formatDate(entry.occurred_at)}`"
              @click="openGalleryPhoto(photo.id)"
            )
              img(:src="getBackendUrl(photo.thumbnail_url)" alt="")
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import Gallery from '@/components/Gallery.vue'
import entriesClient from '@/api/entries-client'
import logsClient from '@/api/logs-client'
import photosClient from '@/api/photos-client'
import { getBackendUrl, getRequestFieldErrors } from '@/api/request'
import {
  calculateGrowLogProgress,
  convertDateToTimestamp,
  convertTimestampToDate,
  formatDate,
  getCurrentDate,
} from '@/time'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const stages = ['germination', 'seedling', 'vegetation', 'bloom']
const growLog = ref(null)
const allPhotos = computed(() => growLog.value.entries.flatMap((entry) => entry.photos))
const photoGallery = ref(null)
const isLoading = ref(true)
const isSavingEntry = ref(false)
const requestError = ref('')
const fieldErrors = ref({})
const photoUploadErrors = ref([])
const selectedPhotoFiles = ref([])
const photoFileInput = ref(null)
const activeEntryId = ref(null)
const entryForm = reactive({ occurred_at: '', stage: '', description: '' })
const selectedReportEntry = computed(
  () => growLog.value?.entries.find((entry) => entry.id === activeEntryId.value) || null,
)
const reportTitle = computed(() => {
  if (selectedReportEntry.value) {
    return 'Edit report'
  }
  return 'Today report'
})
const reportActionLabel = computed(() => {
  if (selectedReportEntry.value) {
    return 'Update'
  }
  return 'Create'
})

onMounted(loadGrowLog)

async function loadGrowLog(preferredEntryId = null) {
  isLoading.value = true
  requestError.value = ''
  try {
    const loadedGrowLog = await logsClient.get(route.params.log_id)
    growLog.value = loadedGrowLog
    selectReportEntry(loadedGrowLog, preferredEntryId)
  } catch (loadError) {
    setRequestErrors(loadError, 'Unable to load grow log')
  } finally {
    isLoading.value = false
  }
}

function selectReportEntry(loadedGrowLog, preferredEntryId) {
  const preferredEntry = loadedGrowLog.entries.find((entry) => entry.id === preferredEntryId)
  if (preferredEntry) {
    setEntryForm(preferredEntry)
    return
  }

  const userTimezone = userStore.user.timezone || 'UTC'
  const currentDate = getCurrentDate(userTimezone)
  const todayEntry = loadedGrowLog.entries.find(
    (entry) => convertTimestampToDate(entry.occurred_at) === currentDate,
  )
  if (todayEntry) {
    setEntryForm(todayEntry)
    return
  }

  const previousEntry = findPreviousEntry(loadedGrowLog.entries, currentDate)
  activeEntryId.value = null
  Object.assign(entryForm, {
    occurred_at: currentDate,
    stage: previousEntry?.stage || '',
    description: '',
  })
  clearSelectedPhotoFiles()
}

function setEntryForm(entry) {
  activeEntryId.value = entry.id
  Object.assign(entryForm, {
    occurred_at: convertTimestampToDate(entry.occurred_at),
    stage: entry.stage,
    description: entry.description || '',
  })
  clearSelectedPhotoFiles()
}

function editEntry(entry) {
  fieldErrors.value = {}
  requestError.value = ''
  photoUploadErrors.value = []
  setEntryForm(entry)
}

function openGalleryPhoto(photoId) {
  photoGallery.value.openPhotoById(photoId)
}

async function saveReport() {
  isSavingEntry.value = true
  requestError.value = ''
  fieldErrors.value = {}
  photoUploadErrors.value = []
  try {
    const reportPayload = {
      occurred_at: convertDateToTimestamp(entryForm.occurred_at),
      stage: entryForm.stage,
      description: entryForm.description || null,
    }
    let savedEntry = selectedReportEntry.value
    if (savedEntry) {
      await entriesClient.update(savedEntry.id, reportPayload)
    } else {
      savedEntry = await entriesClient.create(route.params.log_id, reportPayload)
    }
    await uploadSelectedPhotos(savedEntry.id)
    clearSelectedPhotoFiles()
    await loadGrowLog()
  } catch (saveError) {
    setRequestErrors(saveError, 'Unable to save entry')
  } finally {
    isSavingEntry.value = false
  }
}

async function uploadSelectedPhotos(entryId) {
  for (const selectedPhotoFile of selectedPhotoFiles.value) {
    try {
      await photosClient.upload(entryId, selectedPhotoFile)
    } catch (uploadError) {
      photoUploadErrors.value.push(`${selectedPhotoFile.name}: ${uploadError.message}`)
    }
  }
}

async function deleteEntry(entry) {
  if (!window.confirm('Delete this entry and its photos?')) {
    return
  }
  try {
    await entriesClient.delete(entry.id)
    let preferredEntryId = activeEntryId.value
    if (preferredEntryId === entry.id) {
      preferredEntryId = null
    }
    await loadGrowLog(preferredEntryId)
  } catch (deleteError) {
    setRequestErrors(deleteError, 'Unable to delete entry')
  }
}

async function deletePhoto(photo) {
  try {
    await photosClient.delete(photo.id)
    const reportEntry = selectedReportEntry.value
    if (reportEntry) {
      reportEntry.photos = reportEntry.photos.filter((entryPhoto) => entryPhoto.id !== photo.id)
    }
  } catch (deleteError) {
    setRequestErrors(deleteError, 'Unable to remove photo')
  }
}

function selectPhotos(event) {
  selectedPhotoFiles.value = Array.from(event.target.files || [])
}

function clearSelectedPhotoFiles() {
  selectedPhotoFiles.value = []
  if (photoFileInput.value) {
    photoFileInput.value.value = ''
  }
}

function findPreviousEntry(entries, currentDate) {
  const previousEntries = entries
    .filter((entry) => convertTimestampToDate(entry.occurred_at) < currentDate)
    .sort(
      (firstEntry, secondEntry) =>
        new Date(secondEntry.occurred_at).getTime() - new Date(firstEntry.occurred_at).getTime(),
    )
  return previousEntries[0] || null
}

function formatEntryTitle(entry) {
  const userTimezone = userStore.user.timezone || 'UTC'
  const growLogProgress = calculateGrowLogProgress(
    growLog.value.started_at,
    entry.occurred_at,
    userTimezone,
  )

  return `${formatDate(entry.occurred_at)} · Day ${growLogProgress.dayNumber} · Week ${growLogProgress.weekNumber} · ${entry.stage}`
}

function setRequestErrors(requestErrorValue, fallbackMessage) {
  requestError.value = requestErrorValue.message || fallbackMessage
  fieldErrors.value = getRequestFieldErrors(requestErrorValue)
}
</script>

<style>
.grow-log {
  width: min(900px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 0 0 48px;
}

.grow-log__heading,
.grow-log__entry-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.grow-log__title,
.grow-log__entry-title {
  font-weight: normal;
}

.grow-log__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
  background: var(--color-7);
}

.grow-log__summary-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grow-log__summary-label {
  color: var(--color-4);
}

.grow-log__summary-value,
.grow-log__entry-description {
  white-space: pre-wrap;
}

.grow-log__report,
.grow-log__entries {
  margin-top: 30px;
}

.grow-log__section-title {
  font-weight: normal;
}

.grow-log__report-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
  background: var(--color-7);
}

.grow-log__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grow-log__field--wide {
  grid-column: 1 / -1;
}

.grow-log__field input,
.grow-log__field textarea,
.grow-log__field select {
  padding: 9px;
  border: 1px solid var(--color-2);
  background: #fff;
}

.grow-log__field textarea {
  field-sizing: content;
  min-height: 6rem;
}

.grow-log__form-actions button {
  padding: 9px 14px;
}

.grow-log__field-error,
.grow-log__error,
.grow-log__photo-errors {
  color: #8b1a1a;
}

.grow-log__entry-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.grow-log__entry {
  padding: 18px;
  background: var(--color-7);
}

.grow-log__entry-actions {
  display: flex;
  gap: 10px;
}

.grow-log__photos {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.grow-log__photo {
  width: 180px;
  margin: 0;
}

.grow-log__entry-photo {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.grow-log__photo img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: #b8b8b8;
}

.grow-log__state {
  padding: 18px;
  background: var(--color-7);
}

.grow-log__state--error {
  color: #8b1a1a;
}
</style>
