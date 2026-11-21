<template lang="pug">
section.gallery
  h2.gallery__title Photos
  p.gallery__empty(v-if="photos.length === 0") No photos yet.
  .gallery__grid(v-else)
    button.gallery__thumbnail(
      v-for="(photo, photoIndex) in photos"
      :key="photo.id"
      type="button"
      @click="openPhoto(photoIndex)"
    )
      img(:src="getBackendUrl(photo.thumbnail_url)")
  .gallery__viewer(
    v-if="activePhotoIndex !== null"
    @click.self="closeViewer"
  )
    button.gallery__close(type="button" @click="closeViewer")
      | ×
    button.gallery__navigation.gallery__navigation--previous(
      type="button"
      @click="navigateToPreviousPhoto"
    )
      | ‹
    p.gallery__error(v-if="viewerError") {{ viewerError }}
    .gallery__image(v-if="activePhotoUrl")
      img.gallery__full-image(
        :src="activePhotoUrl"
      )
      span.gallery__caption(v-if="photos[activePhotoIndex].caption") {{ photos[activePhotoIndex].caption }}
    button.gallery__navigation.gallery__navigation--next(
      type="button"
      @click="navigateToNextPhoto"
    )
      | ›
</template>

<script setup>
import { onUnmounted, ref } from 'vue'
import photosClient from '@/api/photos-client'
import { getBackendUrl } from '@/api/request'

const props = defineProps({
  photos: {
    type: Array,
    required: true,
  },
})

const activePhotoIndex = ref(null)
const activePhotoUrl = ref('')
const viewerError = ref('')
const photoRequestIdentifier = ref(0)

defineExpose({ openPhotoById })

onUnmounted(closeViewer)

function openPhoto(photoIndex) {
  window.addEventListener('keydown', handleViewerKeydown)
  void loadPhoto(photoIndex)
}

function openPhotoById(photoId) {
  const photoIndex = props.photos.findIndex((photo) => photo.id === photoId)
  openPhoto(photoIndex)
}

async function loadPhoto(photoIndex) {
  const currentPhotoRequestIdentifier = photoRequestIdentifier.value + 1
  photoRequestIdentifier.value = currentPhotoRequestIdentifier
  revokeActivePhotoUrl()
  activePhotoIndex.value = photoIndex
  viewerError.value = ''

  try {
    const selectedPhoto = props.photos[photoIndex]
    const loadedPhotoUrl = await photosClient.get(selectedPhoto.id)
    if (currentPhotoRequestIdentifier !== photoRequestIdentifier.value) {
      URL.revokeObjectURL(loadedPhotoUrl)
      return
    }
    activePhotoUrl.value = loadedPhotoUrl
  } catch (loadError) {
    if (currentPhotoRequestIdentifier === photoRequestIdentifier.value) {
      viewerError.value = loadError.message
    }
  }
}

function navigateToPreviousPhoto() {
  const previousPhotoIndex =
    (activePhotoIndex.value - 1 + props.photos.length) % props.photos.length
  void loadPhoto(previousPhotoIndex)
}

function navigateToNextPhoto() {
  const nextPhotoIndex = (activePhotoIndex.value + 1) % props.photos.length
  void loadPhoto(nextPhotoIndex)
}

function handleViewerKeydown(keyboardEvent) {
  if (keyboardEvent.key === 'Escape') {
    closeViewer()
    return
  }
  if (keyboardEvent.key === 'ArrowLeft') {
    keyboardEvent.preventDefault()
    navigateToPreviousPhoto()
    return
  }
  if (keyboardEvent.key === 'ArrowRight') {
    keyboardEvent.preventDefault()
    navigateToNextPhoto()
  }
}

function closeViewer() {
  photoRequestIdentifier.value += 1
  revokeActivePhotoUrl()
  activePhotoIndex.value = null
  viewerError.value = ''
  window.removeEventListener('keydown', handleViewerKeydown)
}

function revokeActivePhotoUrl() {
  URL.revokeObjectURL(activePhotoUrl.value)
  activePhotoUrl.value = ''
}
</script>

<style>
.gallery {
  margin-top: 30px;
}

.gallery__title {
  font-weight: normal;
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.gallery__thumbnail {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: #b8b8b8;
  cursor: pointer;
}

.gallery__thumbnail img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.gallery__empty {
  padding: 18px;
  background: var(--color-7);
}

.gallery__viewer {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
  background: rgb(0 0 0 / 95%);
}

.gallery__image {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.gallery__full-image {
  display: block;
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}

.gallery__caption {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  padding: 8px 12px;
  color: #fff;
  background: rgb(0 0 0 / 70%);
  text-align: center;
}

.gallery__close,
.gallery__navigation {
  position: absolute;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 0;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  font-size: 2rem;
  cursor: pointer;
}

.gallery__close {
  top: 16px;
  right: 16px;
}

.gallery__navigation--previous {
  left: 12px;
}

.gallery__navigation--next {
  right: 12px;
}

.gallery__error {
  max-width: 70vw;
  color: #fff;
}

@media (max-width: 600px) {
  .gallery__navigation--previous {
    left: 4px;
  }

  .gallery__navigation--next {
    right: 4px;
  }
}
</style>
