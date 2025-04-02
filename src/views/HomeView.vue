<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>

<template>
  <div class="home">
    <h1>Welcome to Vue 3 + TypeScript</h1>
    <div class="counter">
      <p>Count is: {{ store.count }}</p>
      <p>Double count is: {{ store.doubleCount }}</p>
      <button @click="store.increment">Increment</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home {
  text-align: center;
  padding: 2rem 0;

  h1 {
    color: var(--primary-color);
    margin-bottom: 2rem;
  }

  .counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    button {
      padding: 0.5rem 1rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>