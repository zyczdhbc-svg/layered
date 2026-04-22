<template>
  <HomeView />
</template>

<script setup>
import HomeView from './views/HomeView.vue'
</script>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  background: #f9fafb;
  overflow: hidden;
}

/* Global scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(17, 24, 39, 0.15); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(17, 24, 39, 0.24); }
</style>
