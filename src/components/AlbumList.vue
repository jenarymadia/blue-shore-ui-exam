<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useAlbumStore } from '../stores/album'
import { useAuthStore } from '../stores/auth'
import type { Album, VoteType } from '../types/album'
import { isAdmin, calculateVoteCounts } from '../types/album'
import { debounce } from '../utils/debounce'

const albumStore = useAlbumStore()
const authStore = useAuthStore()

const searchInput = ref('')
const showDeleteConfirm = ref<number | null>(null)
const defaultAlbumCover = 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'

// Sorted albums computed property
const sortedAlbums = computed(() => {
  return [...albumStore.albums].sort((a, b) => {
    const aVotes = getTotalVotes(a)
    const bVotes = getTotalVotes(b)
    
    if (bVotes !== aVotes) {
      return bVotes - aVotes // Sort by votes descending
    }
    // If votes are equal, sort alphabetically by song name
    return a.song_name.localeCompare(b.song_name)
  })
})

// Debounced search function
const debouncedSearch = debounce((value: string) => {
  albumStore.updateSearch(value)
  loadAlbums()
}, 300)

// Watch for search input changes
watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

async function loadAlbums() {
  await albumStore.fetchAlbums({
    page: albumStore.currentPage,
    search: albumStore.searchQuery
  })
}

async function handleVote(album: Album, voteType: VoteType) {
  try {
    await albumStore.voteAlbum(album.id, voteType)
  } catch (error) {
    // Error is already handled in store
  }
}

async function handleDelete(albumId: number) {
  showDeleteConfirm.value = albumId
}

async function confirmDelete(albumId: number) {
  try {
    await albumStore.deleteAlbum(albumId)
    showDeleteConfirm.value = null
  } catch (error) {
    // Error is already handled in store
  }
}

function cancelDelete() {
  showDeleteConfirm.value = null
}

// Calculate total votes
function getTotalVotes(album: Album): number {
  const counts = calculateVoteCounts(album.votes)
  return counts.up - counts.down
}

// Check if user has voted
function hasVoted(album: Album, voteType: VoteType): boolean {
  return album.votes.some(vote => 
    vote.user_id === authStore.user?.id && vote.vote === voteType
  )
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = defaultAlbumCover
}

// Load initial data
onMounted(() => {
  loadAlbums()
})
</script>

<template>
  <div class="album-list">
    <!-- Search Bar -->
    <div class="search-bar">
      <input
        type="text"
        v-model="searchInput"
        placeholder="Search albums..."
        class="search-input"
      />
    </div>

    <!-- Error State -->
    <div v-if="albumStore.error" class="error-message">
      {{ albumStore.error }}
    </div>

    <!-- Loading State -->
    <div v-if="albumStore.loading" class="loading">
      Loading albums...
    </div>

    <!-- Empty State -->
    <div v-else-if="sortedAlbums.length === 0" class="empty-state">
      No albums found
    </div>

    <!-- Album Grid -->
    <div v-else class="album-grid">
      <div v-for="album in sortedAlbums" :key="album.id" class="album-card">
        <div class="album-cover-wrapper">
          <img
            :src="album.album_cover || defaultAlbumCover"
            :alt="album.song_name"
            class="album-cover"
            @error="handleImageError"
            loading="lazy"
          />
        </div>
        <div class="album-info">
          <h3 class="album-name">{{ album.song_name }}</h3>
          <p class="artist-name">{{ album.artist_name }}</p>
          <div class="vote-section">
            <button
              @click="handleVote(album, 'up')"
              class="vote-button upvote"
              :class="{ 'voted': hasVoted(album, 'up') }"
              :disabled="albumStore.voteLoading.has(album.id)"
            >
              ▲
            </button>
            <span class="vote-count" :class="{
              'positive': getTotalVotes(album) > 0,
              'negative': getTotalVotes(album) < 0
            }">
              {{ getTotalVotes(album) }}
            </span>
            <button
              @click="handleVote(album, 'down')"
              class="vote-button downvote"
              :class="{ 'voted': hasVoted(album, 'down') }"
              :disabled="albumStore.voteLoading.has(album.id)"
            >
              ▼
            </button>
          </div>
          <button
            v-if="isAdmin(authStore.user)"
            @click="handleDelete(album.id)"
            class="delete-button"
            :disabled="albumStore.loading"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="albumStore.totalPages > 1" class="pagination">
      <button
        :disabled="albumStore.currentPage === 1"
        @click="albumStore.currentPage--; loadAlbums()"
        class="pagination-button"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ albumStore.currentPage }} of {{ albumStore.totalPages }}
      </span>
      <button
        :disabled="albumStore.currentPage === albumStore.totalPages"
        @click="albumStore.currentPage++; loadAlbums()"
        class="pagination-button"
      >
        Next
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm !== null" class="delete-modal">
        <div class="delete-modal-content">
          <p>Are you sure you want to delete this album?</p>
          <div class="delete-modal-actions">
            <button @click="confirmDelete(showDeleteConfirm)" class="confirm-delete">
              Yes, Delete
            </button>
            <button @click="cancelDelete" class="cancel-delete">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.album-list {
  padding: 2rem;
}

.search-bar {
  margin-bottom: 2rem;

  .search-input {
    width: 100%;
    max-width: 500px;
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

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.album-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
  }
}

.album-cover-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; // 1:1 Aspect ratio
  background: #f1f5f9;
}

.album-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;

  &.loading {
    opacity: 0;
  }
}

.album-info {
  padding: 1rem;
}

.album-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-name {
  color: #666;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vote-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.vote-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.2s ease;
  font-size: 1.2rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.upvote {
    color: #666;
    
    &:hover:not(:disabled) {
      color: var(--primary-color);
    }
    
    &.voted {
      color: var(--primary-color);
    }
  }

  &.downvote {
    color: #666;
    
    &:hover:not(:disabled) {
      color: #dc3545;
    }
    
    &.voted {
      color: #dc3545;
    }
  }
}

.vote-count {
  font-weight: 600;
  min-width: 2rem;
  text-align: center;
  
  &.positive {
    color: var(--primary-color);
  }
  
  &.negative {
    color: #dc3545;
  }
}

.delete-button {
  width: 100%;
  padding: 0.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: darken(#dc3545, 5%);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .delete-modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .delete-modal-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: center;

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s ease;

      &.confirm-delete {
        background-color: #dc3545;
        color: white;

        &:hover {
          background-color: darken(#dc3545, 5%);
        }
      }

      &.cancel-delete {
        background-color: #6c757d;
        color: white;

        &:hover {
          background-color: darken(#6c757d, 5%);
        }
      }
    }
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
}

.page-info {
  font-weight: 500;
}

.error-message {
  color: #dc3545;
  text-align: center;
  padding: 1rem;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

// Responsive adjustments
@media (max-width: 768px) {
  .album-list {
    padding: 1rem;
  }

  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .delete-modal-content {
    margin: 0 1rem;
  }
}

@media (max-width: 480px) {
  .album-grid {
    grid-template-columns: 1fr;
  }
}
</style>