<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="container">
    <RouterView />
  </main>
</template>

<style lang="scss">
@import './assets/styles/main.scss';
</style>