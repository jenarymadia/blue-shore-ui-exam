import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Album, PaginatedAlbumResponse, VoteType, AlbumFilters, VoteResponse } from '../types/album'
import { calculateVoteCounts } from '../types/album'
import { useAuthStore } from './auth'

export const useAlbumStore = defineStore('album', () => {
  const albums = ref<Album[]>([])
  const loading = ref(false)
  const voteLoading = ref(new Set<number>()) // Track loading state per album
  const error = ref<string | null>(null)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const searchQuery = ref('')
  const cache = new Map<string, PaginatedAlbumResponse>()

  const auth = useAuthStore()

  const sortedAlbums = computed(() => {
    return [...albums.value].sort((a, b) => {
      const aVotes = calculateVoteCounts(a.votes)
      const bVotes = calculateVoteCounts(b.votes)
      const aTotal = aVotes.up - aVotes.down
      const bTotal = bVotes.up - bVotes.down
      
      if (bTotal !== aTotal) {
        return bTotal - aTotal
      }
      return a.song_name.localeCompare(b.song_name)
    })
  })

  const getCacheKey = (filters: AlbumFilters) => {
    return `${filters.page}-${filters.search}`
  }

  async function fetchAlbums(filters: AlbumFilters) {
    const cacheKey = getCacheKey(filters)
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)!
      albums.value = cachedData.data
      totalPages.value = cachedData.last_page
      return
    }

    try {
      loading.value = true
      error.value = null

      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        search: filters.search
      })

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/albums?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch albums')
      }

      const data: PaginatedAlbumResponse = await response.json()
      albums.value = data.data
      totalPages.value = data.last_page
      cache.set(cacheKey, data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  async function voteAlbum(albumId: number, voteType: VoteType) {
    if (voteLoading.value.has(albumId)) {
      return // Prevent multiple simultaneous votes
    }

    try {
      voteLoading.value.add(albumId)
      error.value = null

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/albums/${albumId}/vote`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
          },
          credentials: 'include',
          body: JSON.stringify({ vote: voteType })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data: VoteResponse = await response.json()
      
      // Optimistically update the album votes
      const albumIndex = albums.value.findIndex(a => a.id === albumId)
      if (albumIndex !== -1) {
        // Create a new album object to trigger reactivity
        albums.value[albumIndex] = {
          ...albums.value[albumIndex],
          votes: data.votes
        }
      }

      // Clear cache as votes have changed
      cache.clear()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to vote'
      throw error.value
    } finally {
      voteLoading.value.delete(albumId)
    }
  }

  async function deleteAlbum(albumId: number) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/albums/${albumId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
          },
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete album')
      }

      // Remove album from state
      albums.value = albums.value.filter(a => a.id !== albumId)
      
      // Clear cache as data has changed
      cache.clear()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete album'
      throw error.value
    }
  }

  function updateSearch(query: string) {
    searchQuery.value = query
    currentPage.value = 1 // Reset to first page on new search
  }

  function clearCache() {
    cache.clear()
  }

  // Helper function to get cookie value
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
    albums: sortedAlbums,
    loading,
    voteLoading,
    error,
    totalPages,
    currentPage,
    searchQuery,
    fetchAlbums,
    voteAlbum,
    deleteAlbum,
    updateSearch,
    clearCache
  }
})