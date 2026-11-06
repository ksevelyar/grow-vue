<template lang="pug">
.user-header
  router-link.user-header__item(:to="{ name: 'GrowLogs' }") Logs
  router-link.user-header__item(:to="{ name: 'Plants' }") Plants
</template>

<style>
.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  height: 80px;
  padding: 0 10px;
}
</style>
