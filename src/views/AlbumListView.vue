<script setup lang="ts">
import AlbumList from '../components/AlbumList.vue'
</script>

<template>
  <div class="album-list-view">
    <h1>Albums</h1>
    <AlbumList />
  </div>
</template>

<style lang="scss" scoped>
.album-list-view {
  h1 {
    color: var(--primary-color);
    margin-bottom: 2rem;
    text-align: center;
    font-size: 2rem;
  }
}
</style>