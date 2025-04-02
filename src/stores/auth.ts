import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface User {
  id: number;
  email: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function fetchCsrfToken() {
    await fetch(`${import.meta.env.VITE_API_URL}sanctum/csrf-cookie`, {
      credentials: 'include'
    })
  }

  function getCsrfToken() {
    const cookies = document.cookie.split('; ')
    const xsrfToken = cookies.find(row => row.startsWith('XSRF-TOKEN='))
    return xsrfToken ? decodeURIComponent(xsrfToken.split('=')[1]) : null
  }

  async function login(data: LoginData) {
    try {
      loading.value = true
      error.value = null
      
      await fetchCsrfToken()

      const response = await fetch(`${import.meta.env.VITE_API_URL}api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const result = await response.json()
      token.value = result.token
      user.value = result.user
      localStorage.setItem('token', result.token)
      router.push('/albums')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    try {
      loading.value = true
      error.value = null
      
      await fetchCsrfToken()

      const response = await fetch(`${import.meta.env.VITE_API_URL}api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const result = await response.json()
      token.value = result.token
      user.value = result.user
      localStorage.setItem('token', result.token)
      router.push('/albums')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    router.push('/login')
  }

  function init() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
    }
  }

  function getCookie(name: string): string {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift()
      // Laravel's XSRF token is URL-encoded, so we need to decode it
      return cookieValue ? decodeURIComponent(cookieValue) : ''
    }
    return ''
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    getCsrfToken,
    init
  }
})
