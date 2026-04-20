<template>
  <div class="sculpture-workspace" :style="workspaceStyle">
    <!-- ────────── LEFT: AI Create ────────── -->
    <aside class="col left" :class="{ collapsed: leftCollapsed }">
      <!-- Collapsed state: narrow vertical rail with icon + label (clickable) -->
      <button
        v-if="leftCollapsed"
        type="button"
        class="left-rail"
        title="展开 AI Create"
        @click="leftCollapsed = false"
      >
        <span class="left-rail-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"/>
            <path d="M19.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" opacity=".6"/>
          </svg>
        </span>
        <span class="left-rail-label">AI</span>
      </button>

      <!-- Expanded state: full panel -->
      <template v-else>
        <div class="left-head">
          <span class="left-head-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"/>
              <path d="M19.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" opacity=".6"/>
            </svg>
          </span>
          <span class="left-head-title">AI GENERATOR</span>
          <button
            type="button"
            class="panel-collapse-btn"
            title="收起"
            @click="leftCollapsed = true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

      <div class="panel-body">
        <div class="ai-prompt-wrap" :class="{ busy: store.isBusy }">
          <textarea
            v-model="store.userInput"
            class="ai-prompt"
            rows="8"
            :placeholder="store.isBusy ? '生成中，请稍候…' : '例如：一只小鹿和两只小狗在森林里奔跑，夕阳下的山谷，远处有小木屋'"
            :disabled="store.isBusy"
            maxlength="500"
          />
          <div class="ai-prompt-toolbar">
            <!-- Ratio dropdown (inline) -->
            <div
              class="ai-size-picker"
              :class="{ open: ratioOpen }"
              v-click-outside="closeRatio"
            >
              <button
                type="button"
                class="ai-size-inline"
                :disabled="store.isBusy"
                @click="ratioOpen = !ratioOpen"
              >
                <span class="ratio-icon">{{ ratioGlyph(store.aspectRatio) }}</span>
                <span class="ratio-text">{{ store.aspectRatio }}</span>
                <span class="caret">▾</span>
              </button>
              <div v-if="ratioOpen" class="ai-size-floating">
                <button
                  v-for="r in ASPECT_RATIOS"
                  :key="r"
                  type="button"
                  class="ai-size-opt"
                  :class="{ active: store.aspectRatio === r }"
                  @click="onRatioClick(r)"
                >
                  <span class="ratio-icon">{{ ratioGlyph(r) }}</span>
                  <span>{{ r }}</span>
                </button>
              </div>
            </div>

            <span class="ai-counter">{{ (store.userInput || '').length }}/500</span>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-block"
          :disabled="store.isBusy || !store.userInput.trim()"
          @click="onGenerate"
        >
          <span v-if="store.isBusy" class="btn-spin dark" />
          <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M10.6 11.58L14.24 16.53H4.45l2.47-3.26 1.21 1.62 2.48-3.31z"/>
            <path d="M13.84 7.5c1.58.08 2.84 1.4 2.84 3v7.87c-.08 1.53-1.31 2.76-2.84 2.84H5A3 3 0 0 1 2 18.37V10.5A3 3 0 0 1 5 7.5h8.84zM5 9.13a1.37 1.37 0 0 0-1.37 1.37v7.87A1.37 1.37 0 0 0 5 19.74h8.68a1.37 1.37 0 0 0 1.37-1.37V10.5a1.37 1.37 0 0 0-1.37-1.37H5z"/>
            <path d="M17.2 8.1l.3.6c.2.4.7.4.9 0l.3-.6c.4-.9 1.1-1.6 2-2l.5-.2c.4-.2.4-.7 0-.8l-.5-.2c-.9-.4-1.6-1.1-2-2l-.3-.6c-.2-.4-.7-.4-.9 0l-.3.6c-.4.9-1.1 1.6-2 1.9l-.4.3c-.4.2-.4.7 0 .8l.5.2c.8.4 1.6 1.1 1.9 2z"/>
          </svg>
          <span>{{ runLabel }}</span>
        </button>

      </div>
      </template>
    </aside>

    <!-- ────────── MIDDLE: 3D preview only ────────── -->
    <main class="col middle">
      <div
        class="sculpture-scene"
        :class="{ dragging: isDragging }"
        @mousedown="onDragStart"
        @wheel.prevent="onWheel"
        @dblclick="resetView"
      >
        <!-- Floating stage chrome (overlays the scene) -->
        <div class="stage-chrome top-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <span class="chrome-title">3D Preview</span>
        </div>

        <div class="stage-chrome top-right">
          <button
            type="button"
            class="chrome-btn"
            :disabled="!store.hasAnyImage"
            @click.stop="resetView"
            title="复位视角"
          >复位</button>
        </div>

        <div class="stage-perspective" :style="stageStyle">
          <!-- Only render the full stack once ALL 5 layers are done — we
               never want the user to see a half-assembled sculpture. -->
          <template v-if="showStack">
            <div
              v-for="layer in stackedLayers"
              :key="layer.id"
              class="stack-layer"
              :style="layerStyle(layer)"
            >
              <img
                v-if="layer.imageDataUrl || layer.svgDataUrl"
                :src="layerDisplaySrc(layer)"
                :alt="`layer-${layer.id}`"
                draggable="false"
              />
            </div>
          </template>
          <!-- Outer physical frame: a flat plane with black border +
               transparent interior, sits slightly in front of L1 to give
               the whole stack a picture-frame feel. -->
          <div class="stack-layer frame-overlay" :style="frameOverlayStyle">
            <img :src="store.displayFrameDataUrl" alt="frame" draggable="false" />
          </div>
        </div>

        <div v-if="!showStack && !store.isBusy" class="stage-empty">
          <div class="se-icon">⧉</div>
          <div class="se-title">5 层叠雕预览</div>
          <div class="se-sub">在左侧输入描述后，点击生成</div>
        </div>

        <div v-if="store.isBusy" class="stage-loading">
          <div class="loading-inner" />
          <span class="loading-badge">Generating</span>
        </div>

        <div v-if="showStack" class="stage-hint">
          <span>🖱 拖拽旋转</span>
          <span>· 滚轮缩放层距</span>
          <span>· 双击复位</span>
        </div>
      </div>
    </main>

    <!-- ────────── RIGHT: per-layer display + export ────────── -->
    <aside class="col right">
      <div class="panel-head">
        <div class="panel-head-row">
          <span class="panel-title">Layers</span>
        </div>
      </div>

      <div class="panel-body right-body">
        <div
          v-for="layer in store.layers"
          :key="layer.id"
          class="layer-card"
        >
          <div class="lc-head">
            <span class="lc-badge">L{{ layer.id }}</span>
          </div>
          <div class="lc-thumb" :style="{ aspectRatio: thumbAspectRatio }">
            <img v-if="layer.imageDataUrl" :src="layer.imageDataUrl" alt="raster" />
            <div v-else class="thumb-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="20" height="20">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M3 15l4-4 4 4 3-3 7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky export footer -->
      <div class="export-footer">
        <button
          type="button"
          class="btn btn-primary btn-block"
          :disabled="!canExport || isExporting"
          @click="onExportUv5"
        >
          <span v-if="isExporting" class="btn-spin dark" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>{{ isExporting ? '导出中…' : '导出 UV × 5' }}</span>
        </button>
        <div class="export-hint">每层独立矢量化 · 位图 + 激光切割一体 SVG</div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JSZip from 'jszip'
import { useSculptureStore } from '../stores/sculptureStore.js'
import {
  buildUvCutSvg,
  getCanvasSize,
  SUPPORTED_ASPECT_RATIOS,
} from '../composables/useSculpture.js'

// Human-readable ordinal names used in exported filenames, per user spec
// ("first layer, second layer, ..."). Covers all 5 layers; extend as needed.
const LAYER_ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth']

const ASPECT_RATIOS = SUPPORTED_ASPECT_RATIOS

const emit = defineEmits(['toast'])
const store = useSculptureStore()

const DEFAULT_TILT_X = 18
const DEFAULT_TILT_Y = -8
const DEFAULT_BASE_SPACING = 1

const baseSpacing = ref(DEFAULT_BASE_SPACING)
const tiltX       = ref(DEFAULT_TILT_X)
const tiltY       = ref(DEFAULT_TILT_Y)
const isDragging  = ref(false)
const isExporting = ref(false)
const ratioOpen   = ref(false)
// Left-panel collapse state. The Layers panel on the right is always
// visible — once collapsed there was no way to re-open it, so we keep it
// pinned.
const leftCollapsed = ref(false)

const workspaceStyle = computed(() => {
  // Collapsed left keeps a 56px rail visible (icon + "AI" label) so the
  // user always has a visual anchor to re-open it.
  const leftW = leftCollapsed.value ? '56px' : '320px'
  return { gridTemplateColumns: `${leftW} 1fr 360px` }
})

onMounted(() => {
  store.ensureFrame()
})

// Custom directive: local `vClickOutside` => template usage `v-click-outside`
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside_ = (e) => {
      if (!el.contains(e.target)) binding.value(e)
    }
    document.addEventListener('click', el._clickOutside_)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside_)
  },
}

function closeRatio() {
  ratioOpen.value = false
}

function ratioGlyph(r) {
  if (r === '16:9') return '▭'
  if (r === '4:3')  return '▭'
  return '▢'
}

let dragState = null

function onDragStart(e) {
  dragState = { x: e.clientX, y: e.clientY, tx: tiltX.value, ty: tiltY.value }
  isDragging.value = true
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}
function onDragMove(e) {
  if (!dragState) return
  const dx = e.clientX - dragState.x
  const dy = e.clientY - dragState.y
  tiltY.value = clamp(dragState.ty + dx * 0.4, -60, 60)
  tiltX.value = clamp(dragState.tx - dy * 0.4, -30, 70)
}
function onDragEnd() {
  dragState = null
  isDragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}
function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  baseSpacing.value = clamp(baseSpacing.value + delta, 0.3, 3)
}
function resetView() {
  tiltX.value = DEFAULT_TILT_X
  tiltY.value = DEFAULT_TILT_Y
  baseSpacing.value = DEFAULT_BASE_SPACING
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

const runLabel = computed(() => {
  if (store.isBusy) return 'Generating…'
  return 'Generate'
})

const stageStyle = computed(() => {
  const { W, H } = getCanvasSize(store.aspectRatio)
  return {
    transform: `rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`,
    transition: isDragging.value ? 'none' : 'transform .35s cubic-bezier(.2,.8,.3,1)',
    aspectRatio: `${W} / ${H}`,
  }
})

const thumbAspectRatio = computed(() => {
  const { W, H } = getCanvasSize(store.aspectRatio)
  return `${W} / ${H}`
})

function onRatioClick(r) {
  ratioOpen.value = false
  if (r === store.aspectRatio) return
  if (store.hasAnyImage) {
    if (!window.confirm(`切换到 ${r} 会清空已生成的图层，确定吗？`)) return
  }
  store.setAspectRatio(r)
}

const stackedLayers = computed(() => [...store.layers].sort((a, b) => b.id - a.id))

// Gate the 3D preview on "all 5 layers done". We never reveal a
// half-assembled sculpture — during generation the scene shows only the
// loading spinner.
const showStack = computed(() => !store.isBusy && store.allDone && store.hasAnyImage)

function layerDisplaySrc(layer) {
  if (layer.imageDataUrl) return layer.imageDataUrl
  if (layer.svgDataUrl)   return layer.svgDataUrl
  return ''
}

// Flat stacked layers. Each layer is a single image plane offset along Z by
// a fixed step, multiplied by `baseSpacing` (controlled via the scroll
// wheel) so the user can dial the inter-layer spacing to taste.
// L5 = back-most (z=0), L1 = front-most (z = 4*step). The outer frame sits
// just in front of L1. We center the whole stack around z=0 so changing the
// spacing doesn't push the stack toward/away from the perspective camera.
const LAYER_STEP_PX = 18

const stackTotalDepthPx = computed(() => {
  // 5 layers span 4 gaps + frame sits one extra step in front of L1.
  return (4 + 1) * LAYER_STEP_PX * baseSpacing.value
})

function layerStyle(layer) {
  const depthIdx = 5 - layer.id // L5→0 (back), L1→4 (front)
  const z = depthIdx * LAYER_STEP_PX * baseSpacing.value - stackTotalDepthPx.value / 2
  const scaleUp = 1 + depthIdx * 0.004
  return {
    transform: `translateZ(${z}px) scale(${scaleUp})`,
    zIndex: 10 + depthIdx,
    filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.18))',
  }
}

const frameOverlayStyle = computed(() => {
  const z = 5 * LAYER_STEP_PX * baseSpacing.value - stackTotalDepthPx.value / 2
  return {
    transform: `translateZ(${z}px)`,
    zIndex: 100,
    filter: 'drop-shadow(0 10px 22px rgba(0, 0, 0, 0.28))',
  }
})

async function onGenerate() {
  try {
    await store.runFullPipeline()
    if (store.phase === 'done' && store.errorCount === 0) {
      emit('toast', '叠雕生成完成')
    } else if (store.errorCount > 0) {
      emit('toast', `完成，失败 ${store.errorCount} 个`, 'error')
    }
  } catch (e) {
    emit('toast', e.message || '生成失败', 'error')
  }
}

const canExport = computed(() => store.layers.every(l => !!l.imageDataUrl))

async function onExportUv5() {
  if (!canExport.value) {
    emit('toast', '还没有可导出的位图', 'error')
    return
  }
  isExporting.value = true
  try {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    emit('toast', '正在为 5 层逐张抽切割线…')
    // Bundle every generated SVG into a single ZIP archive so the user gets
    // one download instead of fighting 5 consecutive pop-ups (which most
    // browsers throttle/block after the 2nd–3rd file).
    const zip = new JSZip()
    for (const layer of store.layers) {
      const svg = await buildUvCutSvg(layer, { aspectRatio: store.aspectRatio })
      const ordinal = LAYER_ORDINAL[layer.id - 1] || `layer-${layer.id}`
      zip.file(`${ordinal}-layer.svg`, svg)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sculpture-uv-pack-${stamp}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    emit('toast', '已打包下载 5 层 SVG（UV 喷印 + 激光切割）')
  } catch (e) {
    emit('toast', e.message || '导出失败', 'error')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
/* ────────────── TOKENS ────────────── */
.sculpture-workspace {
  --bg-page: #f9fafb;
  --bg-card: #ffffff;
  --bg-soft: #f3f4f6;
  --border: #e5e7eb;
  --border-soft: #f3f4f6;
  --text: #111827;
  --text-sub: #414b5a;
  --text-muted: #9ca3af;
  --accent: #111827;
  --accent-hover: #374151;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;

  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 0;
  transition: grid-template-columns .25s cubic-bezier(.2,.8,.3,1);
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 24%),
    radial-gradient(circle at 16% 50%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 28%),
    linear-gradient(180deg, #d7e0eb, #d1dae5);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text);
}

.col { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

.col.left,
.col.right {
  background: #fff;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
  z-index: 3;
}
.col.left  { border-right: 1px solid var(--border); }
.col.right {
  border-left: 1px solid var(--border);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.02);
}

.panel-head {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-soft);
}
.panel-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.panel-sub   { font-size: 12px; color: var(--text-muted); }
.link-mini {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: inherit;
  transition: background .15s, color .15s;
}
.link-mini:hover:not(:disabled) { background: var(--bg-soft); color: var(--text); }
.link-mini:disabled { opacity: .4; cursor: not-allowed; }

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.right-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-content: start;
}

/* ────────── LEFT: AI Create ────────── */
.ai-prompt-wrap {
  position: relative;
  background: var(--bg-soft);
  border-radius: 14px;
  overflow: visible;
  border: 1px solid transparent;
  transition: border-color .15s;
}
.ai-prompt-wrap:focus-within { border-color: var(--border); }
.ai-prompt-wrap.busy { opacity: .75; }
.ai-prompt {
  width: 100%;
  min-height: 200px;
  box-sizing: border-box;
  resize: none;
  border: none;
  padding: 14px 14px 50px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text);
  background: transparent;
  font-family: inherit;
  outline: none;
  border-radius: 14px;
}
.ai-prompt::placeholder { color: var(--text-muted); }
.ai-prompt-toolbar {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 10px;
}
.ai-counter {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.ai-size-picker { position: relative; }
.ai-size-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background .15s;
}
.ai-size-inline:hover:not(:disabled) { background: var(--bg-soft); }
.ai-size-inline:disabled { opacity: .5; cursor: not-allowed; }
.ratio-icon { color: var(--text-muted); font-size: 13px; line-height: 1; }
.ratio-text { font-variant-numeric: tabular-nums; }
.ai-size-inline .caret { color: var(--text-muted); font-size: 10px; }

.ai-size-floating {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  min-width: 120px;
  box-shadow: 0 6px 20px rgba(17, 24, 39, 0.1);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ai-size-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background .15s;
}
.ai-size-opt:hover { background: var(--bg-soft); }
.ai-size-opt.active { background: #eef2f7; color: var(--accent); font-weight: 600; }

.ai-send-btn {
  width: 30px; height: 30px;
  border: none; border-radius: 10px;
  background: var(--accent);
  color: #fff;
  display: inline-flex;
  align-items: center; justify-content: center;
  cursor: pointer;
  transition: background .15s, transform .12s;
  flex-shrink: 0;
}
.ai-send-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
.ai-send-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
.ai-send-btn svg { width: 14px; height: 14px; }

.btn {
  display: inline-flex;
  align-items: center; justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background .15s, transform .12s, box-shadow .15s;
  font-family: inherit;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }
.btn-block { width: 100%; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); box-shadow: 0 4px 12px rgba(17, 24, 39, 0.12); }

.btn-spin {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
.btn-spin.dark { border-color: rgba(255, 255, 255, 0.25); border-top-color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Progress card */
.progress-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.progress-row { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #cbd5e1; flex: none;
}
.status-dot.loading { background: #f59e0b; animation: pulse 1.2s infinite; }
.status-dot.done    { background: #22c55e; }
.status-dot.err     { background: #ef4444; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.status-text {
  flex: 1; min-width: 0;
  font-size: 12px; color: var(--text-sub);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.status-count {
  background: var(--bg-soft); color: var(--text);
  font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 99px;
}
.progress-bar {
  height: 4px; background: var(--bg-soft); border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4b5563, #111827);
  transition: width .25s ease;
}
.progress-fill.err { background: linear-gradient(90deg, #ef4444, #991b1b); }
.layer-pills { display: flex; gap: 6px; }
.layer-pill {
  flex: 1;
  min-width: 0;
  height: 26px;
  border-radius: 8px;
  background: var(--bg-soft);
  border: 1px solid var(--border-soft);
  display: inline-flex;
  align-items: center; justify-content: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  transition: background .15s, color .15s, border-color .15s;
}
.pill-id { font-variant-numeric: tabular-nums; }
.pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
.layer-pill.pill-generating   { background: #fff7ed; color: #b45309; border-color: #fed7aa; }
.layer-pill.pill-generating .pill-dot   { background: #f59e0b; animation: pulse 1.2s infinite; }
.layer-pill.pill-vectorizing  { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }
.layer-pill.pill-vectorizing .pill-dot  { background: #6366f1; animation: pulse 1.2s infinite; }
.layer-pill.pill-done         { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.layer-pill.pill-done .pill-dot         { background: #22c55e; }
.layer-pill.pill-error        { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.layer-pill.pill-error .pill-dot        { background: #ef4444; }

/* ────────── MIDDLE: Stage ────────── */
.col.middle {
  position: relative;
  padding: 16px;
  overflow: hidden;
}

/* Floating reopen tabs anchored to the edges of the middle column */
.side-reopen-tab {
  position: absolute;
  top: 16px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.06);
  transition: background .15s, transform .15s, box-shadow .15s;
}
.side-reopen-tab:hover {
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.08);
}
.side-reopen-tab.right-tab { right: 16px; }
.side-reopen-tab svg { color: var(--text-muted); }

/* ────────── LEFT: panel header + collapsed rail ────────── */
.left-head {
  padding: 14px 14px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-soft);
}
.left-head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  flex-shrink: 0;
}
.left-head-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.col.left.collapsed {
  padding: 0;
  align-items: stretch;
}
.left-rail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0;
  gap: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.left-rail:hover { background: #f8fafc; }
.left-rail-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
}
.left-rail-label {
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Collapse button inside the panel headers */
.panel-collapse-btn {
  margin-left: auto;
  width: 24px; height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, color .15s;
}
.panel-collapse-btn:hover { background: var(--bg-soft); color: var(--text); }

.panel-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Floating stage chrome (top-left title, top-right tilt + reset) */
.stage-chrome {
  position: absolute;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 99px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.06);
  pointer-events: auto;
}
.stage-chrome.top-left  { top: 12px; left: 14px; }
.stage-chrome.top-right { top: 12px; right: 14px; }
.chrome-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}
.mini-info {
  font-size: 11px;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.mini-info b { color: var(--accent); font-weight: 700; margin-right: 3px; }
.chrome-btn {
  height: 22px;
  padding: 0 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background .15s;
}
.chrome-btn:hover:not(:disabled) { background: var(--accent-hover); }
.chrome-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

.sculpture-scene {
  position: relative;
  flex: 1; min-height: 0;
  background:
    radial-gradient(60% 40% at 50% 45%, rgba(255, 255, 255, .5), transparent 70%),
    linear-gradient(180deg, #ffffff 0%, #eff2f7 60%, #e7ebf1 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  perspective: 1800px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}
.sculpture-scene.dragging { cursor: grabbing; }
.stage-perspective {
  position: relative;
  max-width: min(640px, 82%);
  max-height: 78%;
  aspect-ratio: 1;
  width: 640px;
  transform-style: preserve-3d;
  will-change: transform;
}
.stack-layer {
  position: absolute; inset: 0;
  pointer-events: none;
  transition: transform .3s ease, filter .3s ease;
}
.stack-layer img {
  width: 100%; height: 100%;
  object-fit: contain;
  display: block;
  -webkit-user-drag: none;
}
.stage-hint {
  position: absolute;
  bottom: 12px; left: 14px;
  display: flex; gap: 6px;
  font-size: 11px; color: var(--text-sub);
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(6px);
  padding: 4px 10px; border-radius: 99px;
  border: 1px solid rgba(226, 232, 240, .8);
  pointer-events: none;
  z-index: 4;
}
.stage-empty {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  pointer-events: none;
}
.se-icon {
  width: 54px; height: 54px;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  box-shadow: 0 10px 24px rgba(17, 24, 39, .18);
  margin-bottom: 6px;
}
.se-title { font-size: 14px; font-weight: 600; color: var(--text-sub); }
.se-sub   { font-size: 12px; color: var(--text-muted); }

.stage-loading {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px;
  padding: 16px 22px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
  pointer-events: none;
  z-index: 6;
}
.loading-inner {
  width: 48px; height: 48px;
  border: 3px solid rgba(17, 24, 39, .12);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .85s linear infinite;
}
.loading-badge {
  background: var(--accent);
  color: #fff;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .02em;
}

/* ────────── RIGHT: per-layer cards (2-column grid) ────────── */
.layer-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 8px 10px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color .15s, box-shadow .15s;
  min-width: 0;
}
.layer-card:hover { box-shadow: 0 2px 6px rgba(17, 24, 39, 0.05); }
.layer-card.done { border-color: #bbf7d0; }
.layer-card.err  { border-color: #fecaca; }
.lc-head {
  display: flex; align-items: center; gap: 4px;
  min-width: 0;
}
.lc-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 18px;
  padding: 0 4px;
  background: var(--bg-soft);
  color: var(--text-sub);
  border-radius: 5px;
  font-size: 10px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.lc-name {
  flex: 1; min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lc-status {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.lc-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.lc-thumb {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-soft);
  border: 1px solid var(--border-soft);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.lc-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-empty {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.thumb-spin {
  width: 20px; height: 20px;
  border: 2px solid rgba(17, 24, 39, 0.08);
  border-top-color: var(--text-muted);
  border-radius: 50%;
  animation: spin .9s linear infinite;
}
.thumb-err {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

/* Export footer */
.export-footer {
  flex-shrink: 0;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  display: flex; flex-direction: column; gap: 6px;
}
.export-hint {
  font-size: 10px; color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}
</style>
