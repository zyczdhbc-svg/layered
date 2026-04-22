<template>
  <div class="app">
    <div id="workspace">
      <SculpturePage @toast="showToast" />
    </div>

    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useSculptureStore } from './stores/sculptureStore.js'
import SculpturePage from './components/SculpturePage.vue'

const store = useSculptureStore()
const toast = reactive({ visible: false, msg: '', type: 'info' })
let toastTimer = null

function showToast(msg, type = 'info', duration = 3000) {
  toast.msg = msg
  toast.type = type
  toast.visible = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.visible = false }, duration)
}

onMounted(() => {
  window.__GENERATOR_BRIDGE__ = {
    name: 'sculpture-generator',
    getSnapshot: () => ({
      userInput: store.userInput,
      aspectRatio: store.aspectRatio,
      layers: store.layers.map(l => ({
        id: l.id,
        prompt: l.prompt,
        imageDataUrl: l.imageDataUrl,
        svg: l.svg,
        color: l.color,
        colorOverride: l.colorOverride,
        thickness: l.thickness,
        status: l.status,
      })),
    }),
    getExportData: () => null,
    applySnapshot: (_snap) => { /* optional: restore state */ },
    getOriginImageUrl: () => '',
  }
})
</script>

<style>
html, body, #app {
  background: #f9fafb;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  overflow: hidden;
}

#workspace {
  flex: 1;
  min-height: 0;
  display: flex;
}

.toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%);
  background: #111827; color: #fff;
  padding: 10px 20px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.24);
  pointer-events: none; z-index: 9999;
  white-space: nowrap;
}
.toast.error { background: #ef4444; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3); }
.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(16px); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(17, 24, 39, 0.15); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(17, 24, 39, 0.24); }
</style>
