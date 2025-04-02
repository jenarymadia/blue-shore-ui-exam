<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const password = ref('')

async function handleSubmit() {
  if (email.value && password.value) {
    await auth.login({
      email: email.value,
      password: password.value
    })
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <h1>Login</h1>
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            required
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            required
            autocomplete="current-password"
          />
        </div>
        <div v-if="auth.error" class="error-message">
          {{ auth.error }}
        </div>
        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Loading...' : 'Login' }}
        </button>
        <p class="auth-link">
          Don't have an account? <RouterLink to="/register">Register</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h1 {
    text-align: center;
    color: var(--primary-color);
    margin-bottom: 2rem;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 500;
    }

    input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }
  }

  button {
    padding: 0.75rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }
}

.error-message {
  color: #dc3545;
  text-align: center;
  font-size: 0.9rem;
}

.auth-link {
  text-align: center;
  font-size: 0.9rem;
  margin-top: 1rem;

  a {
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>