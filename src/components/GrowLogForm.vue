<template lang="pug">
form.grow-log-form(@submit.prevent="submitForm")
  label.grow-log-form__field
    span Name
    input(v-model="form.name" name="name" required)
    span.grow-log-form__error(v-if="fieldErrors.name") {{ fieldErrors.name }}
  label.grow-log-form__field
    span Plant
    select(v-model="form.plant_id" name="plant_id" required)
      option(value="" disabled) Select a plant
      option(v-for="plant in plants" :key="plant.id" :value="plant.id") {{ plant.name }}
    span.grow-log-form__error(v-if="fieldErrors.plant_id") {{ fieldErrors.plant_id }}
  label.grow-log-form__field
    span Start date
    input(v-model="form.started_at" name="started_at" type="date" required)
    span.grow-log-form__error(v-if="fieldErrors.started_at") {{ fieldErrors.started_at }}
  label.grow-log-form__field
    span Description
    textarea(v-model="form.description" name="description" rows="4")
  label.grow-log-form__field
    span End date
    input(v-model="form.ended_at" name="ended_at" type="date")
    span.grow-log-form__error(v-if="fieldErrors.ended_at") {{ fieldErrors.ended_at }}
  label.grow-log-form__field
    span Outcome
    textarea(v-model="form.outcome" name="outcome" rows="3")
  .grow-log-form__actions
    button(type="submit" :disabled="isSaving || plants.length === 0") {{ submitLabel }}
    router-link(:to="cancelDestination") Cancel
</template>

<script setup>
const form = defineModel('form', { required: true })

defineProps({
  plants: { type: Array, required: true },
  fieldErrors: { type: Object, required: true },
  isSaving: { type: Boolean, required: true },
  submitLabel: { type: String, required: true },
  cancelDestination: { type: Object, required: true },
})

const emit = defineEmits(['submit'])

function submitForm() {
  emit('submit')
}
</script>

<style>
.grow-log-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grow-log-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grow-log-form__field input,
.grow-log-form__field textarea,
.grow-log-form__field select {
  padding: 9px;
  border: 1px solid var(--color-2);
  background: #fff;
}

.grow-log-form__error {
  color: #8b1a1a;
  font-size: 0.85rem;
}

.grow-log-form__actions {
  display: flex;
  gap: 14px;
  align-items: center;
}

.grow-log-form__actions button {
  padding: 10px 14px;
}
</style>
