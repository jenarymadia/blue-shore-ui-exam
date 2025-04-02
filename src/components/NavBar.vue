<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <nav class="nav">
    <div class="container">
      <ul class="nav__list">
        <template v-if="auth.isAuthenticated">
          <li>
            <RouterLink to="/" class="nav__link">Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/albums" class="nav__link">Albums</RouterLink>
          </li>
          <li>
            <RouterLink to="/about" class="nav__link">About</RouterLink>
          </li>
          <li>
            <button @click="auth.logout" class="nav__link nav__button">Logout</button>
          </li>
        </template>
        <template v-else>
          <li>
            <RouterLink to="/login" class="nav__link">Login</RouterLink>
          </li>
          <li>
            <RouterLink to="/register" class="nav__link">Register</RouterLink>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.nav {
  &__button {
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
  }
}
</style>