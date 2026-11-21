<template lang="pug">
UserHeader

router-view
</template>

<script setup>
import UserHeader from '@/components/UserHeader.vue'
</script>

<style>
:root {
  --color-text: #000;
  --color-text-muted: #575757;
  --color-border: #999;
  --color-page: #687f6f;
  --color-surface: #dfdfdf;
  --color-contrast: #fff;
  --color-error: #8b1a1a;
  --color-placeholder: #b8b8b8;
  --color-overlay: rgb(0 0 0 / 70%);
  --color-backdrop: rgb(0 0 0 / 95%);
}

@font-face {
  font-family: 'Source Code Pro';
  src: url('@/assets/source-code-pro.woff2') format('woff2');
}

body {
  background: var(--color-page);
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

* {
  font-family: 'Source Code Pro', monospace;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input,
textarea,
select {
  box-sizing: border-box;
}

a {
  color: var(--color-text);
  text-decoration: none;
}

a:hover {
  color: var(--color-text-muted);
}
</style>
