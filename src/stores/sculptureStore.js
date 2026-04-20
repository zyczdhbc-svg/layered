import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  LAYER_META,
  SUPPORTED_ASPECT_RATIOS,
  buildBlackFrameDataUrl,
  buildDisplayFrameDataUrl,
  refineSculpturePrompt,
  generateSculptureLayer,
  composeWithFixedFrame,
  vectorizeImage,
  svgToDataUrl,
} from '../composables/useSculpture.js'

const MAX_PARALLEL_GENERATION = 6
const START_STAGGER_MS = 120

export const useSculptureStore = defineStore('sculpture', () => {
  const userInput = ref('')
  const refinedRaw = ref('')
  const frameDataUrl = ref('')
  const aspectRatio = ref('1:1')
  // Display-only frame (transparent interior) — rendered as the front-most
  // overlay in the 3D preview so the user always sees the physical black
  // frame without the magenta chroma-key bleeding through. Computed so it
  // auto-rebuilds on aspect-ratio change and never goes stale through HMR.
  const displayFrameDataUrl = computed(() => buildDisplayFrameDataUrl(aspectRatio.value))
  const phase = ref('idle') // idle | refining | generating | vectorizing | done | error
  const statusText = ref('输入文字，一键生成 5 层叠雕')

  // Per-layer default thickness (px in 3D scene). Each layer represents a
  // physical slab; the Z-stack position of layer i is the sum of thicknesses
  // of every layer BEHIND it (higher id = further back).
  const DEFAULT_THICKNESS = { 1: 18, 2: 18, 3: 18, 4: 18, 5: 10 }

  const layers = ref(
    LAYER_META.map(m => ({
      id: m.id,
      label: m.label,
      zh: m.zh,
      prompt: '',
      rawImageUrl: '',
      imageDataUrl: '',
      svg: '',
      svgDataUrl: '',
      color: '',          // sampled ink color (#rrggbb) from the generated raster
      colorOverride: '',  // user-set color override; empty = use sampled color
      thickness: DEFAULT_THICKNESS[m.id] ?? 18,
      status: 'pending',  // pending | refining | generating | vectorizing | done | error
      error: '',
    })),
  )

  const hasRefined     = computed(() => layers.value.some(l => l.prompt))
  const hasAnyImage    = computed(() => layers.value.some(l => l.imageDataUrl))
  const allDone        = computed(() => layers.value.every(l => l.status === 'done'))
  const doneCount      = computed(() => layers.value.filter(l => l.status === 'done').length)
  const errorCount     = computed(() => layers.value.filter(l => l.status === 'error').length)
  const isBusy         = computed(() => phase.value === 'refining' || phase.value === 'generating' || phase.value === 'vectorizing')

  async function ensureFrame() {
    // Always rebuild so any code change to buildBlackFrameDataUrl (frame
    // thickness, interior color, etc.) is picked up immediately on the next
    // generation — no stale cache, no page-refresh required.
    frameDataUrl.value = buildBlackFrameDataUrl(aspectRatio.value)
    return frameDataUrl.value
  }

  function setAspectRatio(next) {
    if (!SUPPORTED_ASPECT_RATIOS.includes(next)) return
    if (next === aspectRatio.value) return
    if (isBusy.value) return
    aspectRatio.value = next
    frameDataUrl.value = buildBlackFrameDataUrl(next)
    // Any already-generated layer is locked to the old ratio — clear them so
    // the user re-runs at the new ratio with the matching reference frame.
    layers.value.forEach((l) => {
      l.rawImageUrl = ''
      l.imageDataUrl = ''
      l.svg = ''
      l.svgDataUrl = ''
      l.color = ''
      l.colorOverride = ''
      l.status = l.prompt ? 'pending' : 'pending'
      l.error = ''
    })
    statusText.value = `画幅已切换为 ${next}，请重新生成`
  }

  function resetLayers() {
    layers.value = LAYER_META.map(m => ({
      id: m.id, label: m.label, zh: m.zh,
      prompt: '', rawImageUrl: '', imageDataUrl: '', svg: '', svgDataUrl: '',
      color: '', colorOverride: '',
      thickness: DEFAULT_THICKNESS[m.id] ?? 18,
      status: 'pending', error: '',
    }))
  }

  function setLayerThickness(id, value) {
    const layer = layers.value.find(l => l.id === id)
    if (!layer) return
    const n = Number(value)
    if (!Number.isFinite(n)) return
    layer.thickness = Math.max(0, Math.min(80, n))
  }

  function resetThickness() {
    layers.value.forEach((l) => {
      l.thickness = DEFAULT_THICKNESS[l.id] ?? 18
    })
  }

  async function refinePrompt() {
    if (!userInput.value.trim()) {
      statusText.value = '请先输入提示词'
      return
    }
    if (isBusy.value) return
    resetLayers()
    refinedRaw.value = ''
    phase.value = 'refining'
    statusText.value = '大模型润色中…'
    try {
      const { raw, layers: parsed } = await refineSculpturePrompt(userInput.value.trim())
      refinedRaw.value = raw
      parsed.forEach((p) => {
        const L = layers.value.find(x => x.id === p.id)
        if (L) L.prompt = p.prompt
      })
      phase.value = 'idle'
      statusText.value = `润色完成，已生成 ${parsed.length} 个图层提示词`
    } catch (e) {
      phase.value = 'error'
      statusText.value = e.message || '润色失败'
      throw e
    }
  }

  async function generateOneLayer(id) {
    const layer = layers.value.find(l => l.id === id)
    if (!layer || !layer.prompt) return
    await ensureFrame()
    layer.status = 'generating'
    layer.error = ''
    try {
      const url = await generateSculptureLayer(layer.id, layer.prompt, frameDataUrl.value, {
        aspectRatio: aspectRatio.value,
      })
      layer.rawImageUrl = url
      layer.status = 'vectorizing'
      layer.imageDataUrl = await composeWithFixedFrame(url, frameDataUrl.value, { layerId: layer.id })
      // L5 is print-only — no laser-cut silhouette, so skip vectorization.
      if (layer.id === 5) {
        layer.svg = ''
        layer.svgDataUrl = ''
        layer.color = ''
      } else {
        const { svg, color } = await vectorizeImage(layer.imageDataUrl)
        layer.svg = svg
        layer.svgDataUrl = svgToDataUrl(svg)
        layer.color = color
      }
      layer.status = 'done'
    } catch (e) {
      layer.status = 'error'
      layer.error = e.message || '生成失败'
    }
  }

  async function generateAll({ onlyPending = false } = {}) {
    if (!hasRefined.value) {
      statusText.value = '请先完成润色'
      return
    }
    if (isBusy.value) return
    await ensureFrame()
    phase.value = 'generating'
    const pending = layers.value.filter((l) => {
      if (!l.prompt) return false
      if (onlyPending && l.status === 'done') return false
      return true
    })
    pending.forEach(l => {
      l.status = 'pending'; l.error = ''
      l.rawImageUrl = ''; l.imageDataUrl = ''; l.svg = ''; l.svgDataUrl = ''
      l.color = ''
    })
    statusText.value = `并行生成 ${pending.length} 个图层…`

    let cursor = 0
    const concurrency = Math.max(1, Math.min(MAX_PARALLEL_GENERATION, pending.length))
    let started = 0
    const worker = async () => {
      while (cursor < pending.length) {
        const idx = cursor
        cursor += 1
        const layer = pending[idx]
        const myStart = started
        started += 1
        await new Promise(r => setTimeout(r, myStart * START_STAGGER_MS))
        await generateOneLayer(layer.id)
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))

    phase.value = 'done'
    statusText.value = `生成完成：成功 ${doneCount.value}，失败 ${errorCount.value}`
  }

  async function runFullPipeline() {
    try {
      await refinePrompt()
      await generateAll({ onlyPending: true })
    } catch (_) { /* statusText already set */ }
  }

  async function regenerateLayer(id) {
    if (isBusy.value) return
    const layer = layers.value.find(l => l.id === id)
    if (!layer || !layer.prompt) return
    phase.value = 'generating'
    statusText.value = `重新生成 Layer ${id}…`
    layer.imageDataUrl = ''; layer.svg = ''; layer.svgDataUrl = ''
    await generateOneLayer(id)
    phase.value = allDone.value ? 'done' : 'idle'
    statusText.value = layer.status === 'done' ? `Layer ${id} 已重新生成` : `Layer ${id} 失败：${layer.error}`
  }

  function updateLayerPrompt(id, newPrompt) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) layer.prompt = newPrompt
  }

  function setLayerColorOverride(id, hex) {
    const layer = layers.value.find(l => l.id === id)
    if (!layer) return
    const sampled = (layer.color || '').toLowerCase()
    const next = (hex || '').toLowerCase()
    layer.colorOverride = next && next !== sampled ? next : ''
  }

  return {
    userInput, refinedRaw, frameDataUrl, displayFrameDataUrl, aspectRatio, phase, statusText, layers,
    hasRefined, hasAnyImage, allDone, doneCount, errorCount, isBusy,
    ensureFrame, setAspectRatio, refinePrompt, generateAll, generateOneLayer, regenerateLayer,
    runFullPipeline, resetLayers, updateLayerPrompt, setLayerColorOverride,
    setLayerThickness, resetThickness,
  }
})
