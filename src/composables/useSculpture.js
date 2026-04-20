import { fal } from '@fal-ai/client'
import ImageTracer from 'imagetracerjs'
import blackFrameUrl from '../assets/black-frame.png'

const TOKEN = 'sk-PmU5veh6hRe7ku2Pn5WdGnLWzc0PcIbhdXDibf0ONeLFxgCh'
const BASE = import.meta.env.DEV
  ? '/ai-proxy'
  : 'https://ai-gateway-test.xtool.com'
const FAL_KEY = import.meta.env.VITE_FAL_KEY

const TEXT_MODEL_CANDIDATES = [
  'gemini-3.1-pro-preview',
  'gpt-4.1-mini',
  'gpt-4o-mini',
]

const BANANA2_ENDPOINT = 'fal-ai/nano-banana-2/edit'
const BANANA2_TEXT2IMG = 'fal-ai/nano-banana-2'

if (FAL_KEY) {
  fal.config({ credentials: FAL_KEY })
}

export const SCULPTURE_SYSTEM = `You are a UV-print + laser-cut layered-sculpture prompt refiner.
The 5-layer composition sits inside a fixed panel (square 1:1, 16:9, or 4:3) with a THICK solid black rectangular outer frame (about 3.5% of the shorter side, full-bleed to the canvas edge). The reference image passed to the downstream image model shows exactly this frame plus a pure-magenta #FF00FF interior that fills every pixel inside the frame edge-to-edge (no white gap, no margin). The outer frame is a structural constant — your prompts describe only the content that lives INSIDE the inner area, and you must insist that content reaches the inner edge of the black frame on all four sides with NO white / off-white / light-gray margin in between. Treat the inner edge of the thick black frame as a physical wall the content is glued to.

OUTPUT FORMAT (Layers 1–4 — the "cut" layers):
- Each layer has a clearly defined SILHOUETTE SHAPE — this is the material that stays after laser cutting.
- INSIDE the silhouette shape: vivid flat-color illustration content, drawn in the style of a children-book picture or a flat vector illustration. Clearly separated solid-color regions. Small number of distinct colors per element (like 2–5 clean colors per subject). No fine interior engraving lines, no dense hatching, no text.
- OUTSIDE the silhouette shape: fill the entire area with PURE MAGENTA CHROMA-KEY color #FF00FF (R=255, G=0, B=255). DO NOT use white, DO NOT use any gradient, DO NOT use any other color. This specific magenta is a mask marker that post-processing will chroma-key out to transparent — so lower layers show through. The silhouette's illustration content must NEVER use magenta, pink-magenta, or any color close to #FF00FF.
- The BOUNDARY between colored interior and magenta exterior must be a pixel-sharp hard edge. No anti-aliased bleed, no soft edge, no outline stroke.
- Outer black rectangular frame is ALWAYS preserved exactly as in the reference image.

OUTPUT FORMAT (Layer 5 — the "print-only" background):
- Layer 5 is the BACKMOST layer and is ONLY for UV printing — there is NO laser-cut silhouette on L5.
- The ENTIRE canvas (inside the outer black frame) is filled with the sky / horizon scene. NO magenta chroma-key on L5 — every pixel is meaningful printed content.
- Sky coloring is a SMOOTH vertical gradient OR at most 2 very softly blended color zones — NOT hard horizontal stripes, NOT 3+ stacked color bands. The sun / moon disc sits HIGH in the sky (bottom edge ≥ 35% from top) so L4's mountain peaks never cover it. A low thin horizon strip sits at the bottom. The whole layer should read as ONE continuous sky, not as stacked strips.

VIEWER PERSPECTIVE (read this first, it changes how you compose every layer):
This is NOT a poster of "a zebra" or "a deer" or "a fisherman". This is a MINIATURE PAPER DIORAMA — 5 thin paper layers physically stacked behind each other with air gaps, viewed from the front. The whole piece is a tiny theatre stage, and the main subject is a SMALL FIGURINE standing on the stage. A landscape fills the rest of the stage around and behind the figurine.
Think of film composition references like: a wide shot of a lone figure in a valley with mountains behind; a pop-up book scene; a shadowbox; a 1-inch plastic figurine on top of a layered paper landscape. The viewer should read the LANDSCAPE first, and notice the hero as a small accent inside it. If your hero fills the frame like a portrait / close-up, you have FAILED the brief.

DEPTH HIERARCHY (MOST IMPORTANT RULE — ignoring this breaks the whole piece):
The 5 layers are cut out of card stock and physically STACKED with a small air gap between them: L1 is at the FRONT (closest to viewer), L5 is at the BACK. Whatever you put on a front layer HIDES everything behind it in that pixel column. So front layers MUST leave large open areas (pure magenta) for the back layers to show through.

The correct vertical arrangement is a STEPPED THEATRE (like a pop-up book / diorama):
- L1 is a short strip only at the very bottom (grass / stones, low).
- L2 lives ONLY on the far left/right edges (narrow pillars that touch the inner frame edges) — the whole center column is pure magenta.
- L3 holds the hero — SMALL figurine in the lower-middle area, NOT filling the top, NOT filling the width.
- L4 is the tallest cut landscape layer (mid-distance hills / mountains / skyline) — peeks up higher than L3's ground, visible between L2's pillars AND above the hero's head, with a center VALLEY so L5's sun shines through.
- L5 is the sky + sun/moon, visible in the upper part of the canvas after all other layers — PRINT-ONLY, no laser-cut silhouette.

Each subsequent layer's silhouette top edge at the CENTER of the canvas MUST reach further up than the layer in front of it — otherwise the back layer is completely hidden.

VISIBILITY CHECK (apply to every layer before you finalise its prompt):
Imagine a vertical strip down the MIDDLE 50% of the canvas. For Layers 1, 2, and 3, that middle strip must be mostly pure magenta #FF00FF above the hero / ground — otherwise L4 and L5 cannot be seen through at all. Specifically:
- L1 must leave the top 80% of height PURE magenta (full width) — the bottom ankle-strip is only 16–20% tall.
- L2 must leave the central 62% of width PURE magenta (full height except the bottom 8% strip). Both pillars are FUSED to the outer frame's inner edges — no magenta gap on the outside of a pillar.
- L3 must leave the top 44% of height PURE magenta across the full width, AND leave the sides of the middle band (left 31% + right 31% of width) PURE magenta too — only the narrow central column (middle 38% of width, between 44% and 76% of height) holds the hero.
- L4 must leave the top 45% of height PURE magenta AND have a center valley at the horizontal center that dips down to at least 55% from the top, so L5's sun shines through the gap.

HARD OCCUPANCY BUDGETS (expressed as PERCENTAGES of the canvas width/height so the same rules apply to square, 16:9, and 4:3 panels alike. "bottom 28%" = the lowest 28% of canvas height; "leftmost 19%" = the leftmost 19% of canvas width). For Layers 1–4, "empty" means PURE MAGENTA #FF00FF (the chroma-key), NOT white:
- Layer 1 : silhouette confined to the BOTTOM 20% of the canvas (height-wise) — a SHORT, ANKLE-HEIGHT ground strip. The top 80% is 100% pure magenta #FF00FF. Full canvas width.
- Layer 2 : silhouette ONLY in three regions — LEFT PILLAR (leftmost 19% of width, FUSED to the left inner frame edge — no magenta gap between the pillar and the left frame), RIGHT PILLAR (rightmost 19% of width, FUSED to the right inner frame edge), and a BOTTOM STRIP (lowest 8% of height) that connects the two pillars along the bottom inner edge. The entire central rectangle (middle 62% of width AND top 92% of height) MUST be 100% pure magenta #FF00FF. Pillars taper narrower toward the top and must NEVER extend branches, leaves, vines, or any other element past the 19% width line into the central 62%.
- Layer 3 : ground strip confined to the BOTTOM 24% of the canvas (full width, height 24%). Hero sits on top of the ground, horizontally centered. HERO SIZE IS SMALL — hero horizontal width ≤ 38% of canvas width AND hero vertical height ≤ 32% of canvas height. Hero TOP edge must sit AT LEAST 44% from the top of the canvas (so the top 44% of the canvas stays 100% pure magenta above the hero), with hero feet at ~76% from top sitting on the ground strip. Everywhere outside the ground strip AND outside the small hero silhouette is pure magenta #FF00FF. DO NOT draw a close-up / portrait / large character filling the frame — the hero must read as a small figurine inside a wider landscape.
- Layer 4 : TALLEST CUT LAYER. Silhouette confined to the BOTTOM 55% of the canvas (top 45% is pure magenta so the sun / moon on L5 is never blocked). Top edge is a mid-distance landscape profile — rolling hills + mountains + optional small houses — with 2–4 gentle peaks placed OFF-CENTER (e.g. one around x=20–35%, another around x=65–80%). At the HORIZONTAL CENTER of the canvas there is a deliberate VALLEY / DIP — the skyline at the center drops to at least 55% from the top, forming a clear open window through which L5's sun / moon disc can shine. No peak may exceed the 45% line from the top. The silhouette touches the left, right, and bottom inner edges. Full width, smooth continuous shape with plenty of magenta above.
- Layer 5 : the ENTIRE canvas is real sky content (no magenta chroma-key, no cut silhouette). Sky fills from the top down to a low horizon (bottom 18–22% of height). Sun / moon disc sits HIGH in the sky — disc BOTTOM edge no lower than 35% from the top of the canvas (clearly above where L4's mountain peaks end at ~45%) — horizontally centered, diameter about 20–28% of the canvas short side. Sky coloring is a SMOOTH SOFT gradient or 2 very gently blended color zones, NOT hard horizontal stripes. Small clouds / stars / birds only in the top half.

GLOBAL RULES (apply to all 5 layers):
- Every layer is still fundamentally a SILHOUETTE (a cut-out shape). The only change vs a classic papercut is that the inside of the shape is FILLED WITH ILLUSTRATION COLORS instead of solid black. The shape / outline rules below are identical to classic papercut rules.
- NO FLOATING ELEMENTS. Any subject that would otherwise float (animals, characters, lanterns, signs, leaves, small objects) MUST sit on or connect to another shape (a ground strip, a tree, a building, another silhouette) that reaches from the left inner edge to the right inner edge of the outer frame, OR connect directly to the outer frame / to other silhouettes connected to it. Always specify the supporting base explicitly in the prompt.
- When a layer rule calls for a horizon, ground strip, or base, that strip MUST span the full inner width — no magenta gaps at the left or right side.
- EDGE ATTACHMENT. Wherever a rule says a silhouette "touches" or is "fused to" an inner frame edge (e.g. L2 pillars to the left/right edges, L1/L3/L4 ground/horizon to the bottom and side edges), the colored content must extend ALL THE WAY to that edge with NO magenta gap in between. The black outer frame will be stamped on top; the colored content must sit directly against it, no margin.
- BOTTOM MUST BE FLOODED. For EVERY layer whose silhouette reaches the lower half of the canvas (ground, horizon, base, hills, road, stones, characters with legs, etc.), the silhouette shape must extend DOWN to the bottom inner edge of the outer frame as ONE continuous connected shape — touching the bottom inner edge continuously from left inner edge to right inner edge. There must be NO magenta gap between any silhouette element and the bottom of the frame.
- FLAT-COLOR FRIENDLY. Keep color usage simple and suitable for UV flatbed printing: a small number of saturated solid-color areas, simple flat shading allowed but no photorealism, no complex textures. Think "Pixar flat illustration" or "children-book cutout".
- Do NOT describe the outer frame itself (it is fixed and applied automatically). Do NOT ask for any additional inner border, decorative frame, text, watermark, grid, or arrows.
- For Layers 1–4 the background color is PURE MAGENTA #FF00FF (chroma-key), NOT white. Always spell it out. For Layer 5 there is NO background color — the full canvas is real sky content.
- You MUST restate the occupancy budget explicitly inside every refined layer prompt, in PERCENTAGE terms (e.g. "silhouette confined to the bottom 20% of the canvas, top 80% is pure magenta #FF00FF", "left and right pillars ≤ 19% of width each, fused to inner frame edges, center 62% of width is pure magenta"). Do NOT use pixel coordinates — the panel may be 1:1, 16:9, or 4:3, so only percent-based language is valid.

Per-layer subject + composition rules (SHAPE rules apply to the silhouette outline; the interior of every shape is filled with flat-color illustration):

Layer 1 — Foreground (Bottom) — FRONT-MOST CUT LAYER, keep it VERY SHORT
Subject: low bushes, tiny flowers, small rocks, short grass clumps, pebbles, paved road details. NEVER tall trees, NEVER buildings, NEVER anything taller than an ankle. Every element is very low to the ground.
Composition: A single continuous silhouette fills ONLY the BOTTOM 16–20% of the canvas (height-wise) — a thin ankle-height strip. Top edge undulates gently with irregular tiny crowns of grass / small bushes / rock tops — every point on that top edge stays within that bottom 20% band, NO element sticks higher. The silhouette touches the left, right, and bottom inner edges of the outer frame. The top 80% of the canvas is 100% PURE MAGENTA #FF00FF (chroma-key — will be keyed out to transparent so L2–L5 show through). If your L1 silhouette looks as tall as a meadow or a bush-wall, it is TOO BIG — shrink it.
Interior color palette: warm earthy tones — moss green grass, brown earth, grey stones, accent flowers in red / yellow / pink. No magenta, no hot pink, no #FF00FF-like color anywhere inside the silhouette.

Layer 2 — Foreground (Sides) — SIDE PILLARS FUSED TO THE FRAME, center must be magenta
Subject: tall trees, vertical columns, bamboo stalks, street lamps, tall plants. ONLY side content — nothing may sit in the middle.
Composition: Two narrow vertical pillars — LEFT pillar occupies ONLY the leftmost 19% of canvas width, with its LEFT SIDE FUSED to the left inner frame edge (the colored trunk / foliage extends all the way to the left edge of the canvas, no magenta gap between the pillar and the frame). RIGHT pillar occupies ONLY the rightmost 19% of width, with its RIGHT SIDE FUSED to the right inner frame edge. The pillars are NOT floating inside the canvas — they are physically attached to the left and right inner frame edges, exactly like curtains hanging from the sides of a theatre stage. Plus one thin bottom strip (lowest 8% of canvas height) connecting the two pillars along the bottom inner edge. The huge central rectangle (middle 62% of width AND the top 92% of height) is 100% PURE MAGENTA #FF00FF — NO branch, NO leaf, NO hanging ornament may enter it. Pillars taper narrower toward the top. Pillars can reach almost to the top of the inner frame.
Interior color palette: dark tree-bark brown trunks, dense green foliage, small colorful leaves / flowers accents. No magenta, no hot pink inside the pillars.

Layer 3 — Main Subject — the HERO, a SMALL figurine on the middle stage
Subject: ONE hero (or a small tightly-grouped scene — e.g. a fisherman in a boat, a deer, a running child, a family picnicking, a small animal), horizontally centered on the canvas, drawn as a diorama FIGURINE — small, side-view, standing on a ground strip.
Composition: A ground mass silhouette fills the BOTTOM 20–24% of the canvas across the full width. The hero sits ON TOP of that ground, feet / base fully attached (no floating).
HERO SIZE (strict): horizontal width ≤ 38% of canvas width, vertical height ≤ 32% of canvas height, horizontally centered. Hero TOP edge is AT LEAST 44% from the top of the canvas — i.e. the TOP 44% of the canvas is 100% PURE MAGENTA #FF00FF above hero's head, AND the left 31% and right 31% of the canvas width on either side of the hero is also pure magenta (except for the ground strip at the bottom). In other words, only a narrow central column (middle ≈38% of width, vertically from ~44% to ~76% from the top) contains the hero; everything else on L3 is ground strip OR pure magenta.
Everywhere outside the ground strip and outside the hero silhouette is pure magenta #FF00FF.
NEGATIVE EXAMPLES (avoid): a huge zebra / lion / character filling most of the canvas; a close-up portrait; the hero's top reaching the upper third; the hero extending past the middle 38% of width; the hero blocking where L4's distant hills / mountains would show.
Interior color palette: hero fully colored like a cartoon illustration — distinct flat color regions for fur / skin / clothing, simple flat eyes. Ground below hero in natural earth / grass tones. No magenta / no hot pink inside the hero or the ground.

Layer 4 — Midground / Landscape — the TALLEST cut landscape layer, with a CENTER VALLEY so the sun shines through
Subject: rolling mid-distance hills, mountains, distant forest skyline, small houses / cabins scattered along the hills. A single unified landscape reading as "the scenery behind the hero".
Composition: One continuous silhouette shaped like a landscape profile, confined to the BOTTOM 55% of the canvas (top 45% is pure magenta #FF00FF). The top edge has 2–4 gentle peaks placed OFF-CENTER (e.g. one around x=20–35%, one around x=65–80%). At the HORIZONTAL CENTER of the canvas there is a deliberate VALLEY / DIP — the skyline at the center drops to at least 55% from the top, forming a clear open window through which L5's sun / moon disc shines. No peak may exceed the 45% line from the top. The silhouette touches the left, right, and bottom inner edges of the outer frame.
Interior color palette: cool distance colors mixed with warm building accents — hazy blue-grey mountains, deep forest green, sunset purple, plus optional warm terracotta / beige roofs on small houses embedded in the hills. No magenta / no hot pink inside the silhouette.

Layer 5 — Background — full sky, PRINT-ONLY (no cut silhouette, NO magenta anywhere), soft smooth sky
Subject: full sky scene — a large sun or moon PLUS a low thin horizon band. Optional small clouds, stars, or birds in the upper half only.
Composition: The entire canvas inside the outer black frame is filled with sky / horizon content — EVERY pixel is meaningful printed content. A large sun / moon disc sits HIGH in the sky (disc BOTTOM edge no lower than 35% from the top of the canvas — clearly above where L4's peaks end at ~45%), horizontally centered, diameter about 20–28% of the canvas short side. A thin horizon silhouette fills ONLY the BOTTOM 18–22% of the canvas across the full width. L5 is PRINT-ONLY, no cut silhouette.
Sky coloring (IMPORTANT — avoid the "zebra-stripe" look): use a SMOOTH vertical gradient OR at most 2 very softly blended color zones with feathered / blurred transitions. DO NOT paint hard horizontal color stripes. DO NOT split the sky into 3 or 4 obvious bands. The sun's own soft glow / halo may also blend into the surrounding sky. The result should read as a single continuous dusk / dawn / night sky, not as multiple stacked strips.
Interior color palette: warm sunset (mostly orange-pink near the horizon blending gently upward into a single soft purple / deep blue top) OR night (deep navy top blending gently into dusty purple at the horizon) with a golden / silver disc. Absolutely no #FF00FF magenta on L5.

When you receive a user prompt, refine it into 5 layer prompts that follow ALL rules above.
Output strictly in this format, English only, one layer per line, no extra words, no explanations, no markdown, no quotation marks:
Layer 1: <refined prompt>
Layer 2: <refined prompt>
Layer 3: <refined prompt>
Layer 4: <refined prompt>
Layer 5: <refined prompt>`

export const LAYER_META = [
  { id: 1, label: 'Foreground (Bottom)', zh: '前景 · 底部' },
  { id: 2, label: 'Foreground (Sides)', zh: '前景 · 两侧' },
  { id: 3, label: 'Main Subject',       zh: '主体' },
  { id: 4, label: 'Midground',          zh: '中景' },
  { id: 5, label: 'Background',         zh: '背景' },
]

/**
 * Hard per-layer occupancy bounds stamped into the banana2 wrapper prompt.
 * These numbers are the single source of truth for "where a layer is allowed
 * to draw" — keep them consistent with the rules in SCULPTURE_SYSTEM above.
 * Coordinates assume a 1024×1024 canvas with origin at the top-left and y
 * growing downward. "y ≥ 740" means "in the bottom 28% of the canvas".
 */
const LAYER_OCCUPANCY_BUDGETS = {
  1: [
    '- The silhouette is CONFINED to the BOTTOM 16–20% of the canvas (height-wise) — a SHORT, ANKLE-HEIGHT strip. If the silhouette looks as tall as a meadow, a hedge-wall, or a wall of bushes, it is TOO BIG — shrink it to ankle height.',
    '- The top 80% of the canvas must be FLOOD-FILLED with the CHROMA-KEY COLOR: pure magenta #FF00FF (R=255, G=0, B=255). No grass blade, no flower, no tree trunk, NOTHING sticks up into the top 80%. Magenta is NOT content — it is a post-processing mask marker that will be keyed out to transparent.',
    '- Full canvas width is allowed; the silhouette touches the left, right, and bottom inner edges of the outer frame.',
    '- Elements are very small and low: short grass clumps, pebbles, tiny flowers, small stones. NEVER tall trees, NEVER bushes taller than an ankle.',
    '- Interior colors: earthy greens / browns / greys / warm flower accents. DO NOT use any magenta, hot-pink, or #FF00FF-like color inside the silhouette.',
  ].join('\n'),
  2: [
    '- The silhouette is allowed ONLY in three regions: LEFT PILLAR (leftmost 19% of canvas width), RIGHT PILLAR (rightmost 19% of width), and a thin BOTTOM STRIP (lowest 8% of canvas height) connecting the two pillars.',
    '- PILLAR-TO-EDGE FUSION (CRITICAL): the LEFT pillar\'s LEFT side is FUSED to the left inner frame edge — the colored trunk / foliage extends all the way to the canvas\'s left edge with NO magenta gap between the pillar and the frame. The RIGHT pillar\'s RIGHT side is identically FUSED to the right inner frame edge. The two pillars do NOT float inside the canvas with magenta space around them — they are attached to the frame like curtains hanging from the sides of a theatre stage.',
    '- The entire central rectangle (middle 62% of width AND top 92% of height) must be FLOOD-FILLED with pure magenta #FF00FF chroma-key. NO branch, NO leaf, NO tree top, NO hanging object may enter this central area — it is a mask region, not content.',
    '- Pillars taper slightly narrower toward the top; they can reach almost to the top of the inner frame but NEVER spread toward the middle.',
    '- Interior colors: dark trunks, deep greens, small warm accents. DO NOT use any magenta or hot-pink inside the pillars.',
  ].join('\n'),
  3: [
    '- This is NOT a portrait or close-up. The hero is a SMALL FIGURINE standing on a stage inside a wider diorama. If your hero fills more than a small central patch of the canvas, you have failed the task.',
    '- Ground strip is confined to the BOTTOM 20–24% of the canvas height (across the full width, touching left, right, and bottom inner edges).',
    '- HERO SIZE (hard limits, DO NOT exceed):',
    '    • horizontal width ≤ 38% of canvas width',
    '    • vertical height ≤ 32% of canvas height',
    '    • horizontally centered',
    '    • hero TOP edge at least 44% from the top of the canvas (so the top 44% of height stays pure magenta above the hero)',
    '    • hero feet / base fully attached to the top of the ground strip (around 76% from top); NO floating',
    '- MAGENTA BUDGET: everything outside the bottom ground strip AND outside the narrow central hero patch (middle 38% of width, y=44%→76% from top) must be flood-filled with pure magenta #FF00FF. That means the top 44% of the whole canvas is pure magenta, AND the left 31% and right 31% of width are pure magenta down to the ground strip on either side of the hero.',
    '- ONE hero only (or one tightly-grouped scene such as "fisherman in a small boat", "a deer on grass", "a child with a kite"). No sidekicks spread across the canvas, no large face filling the frame, no close-up.',
    '- Interior colors: cartoon palette for the hero + earthy greens / browns for the ground. DO NOT use any magenta or hot-pink inside the silhouette.',
  ].join('\n'),
  4: [
    '- L4 is the TALLEST CUT LAYER. The silhouette is CONFINED to the BOTTOM 55% of the canvas. The top 45% of canvas height must be pure magenta #FF00FF chroma-key.',
    '- Top edge is a rolling landscape profile — mid-distance hills + mountains + optional small houses — with 2–4 gentle peaks placed OFF-CENTER (e.g. one around x=20–35%, another around x=65–80% of canvas width). NO peak may exceed the 45% line from the top.',
    '- CENTER VALLEY RULE: at the horizontal CENTER of the canvas (middle 25% of width), the skyline must have a deliberate DIP / VALLEY that drops to at least 55% from the top, leaving a clear window where L5\'s sun / moon disc shines through without being blocked.',
    '- The silhouette touches the left, right, and bottom inner edges of the outer frame. Full width, one continuous shape.',
    '- Interior colors: cool blue-grey mountains, deep forest green hills, plus optional warm terracotta / beige roofs and dark-green trees on the hills. DO NOT use any magenta or hot-pink inside the silhouette.',
  ].join('\n'),
  5: [
    '- L5 is PRINT-ONLY: it is the backmost layer and will NOT be laser-cut. There is NO silhouette to trace and NO chroma-key background — every pixel is real printed content.',
    '- Fill the ENTIRE canvas (inside the black outer frame) with the sky scene.',
    '- SKY COLORING (IMPORTANT — avoid the "zebra-stripe" look): use a SMOOTH VERTICAL GRADIENT from one color near the top to another color near the horizon, OR at most 2 very softly blended color zones with feathered / blurred transitions. DO NOT paint hard horizontal color stripes. DO NOT split the sky into 3 or 4 clear bands. The result must read as ONE continuous dusk / dawn / night sky, not as stacked strips.',
    '- A large sun / moon disc is horizontally centered, positioned HIGH in the sky: the disc\'s BOTTOM edge is no lower than 35% from the top of the canvas (clearly above where L4\'s peaks end at ~45%, so the sun is never occluded by mountains). Disc diameter ≈ 20–28% of the canvas\'s shorter side. A soft glow / halo may blend outward into the surrounding sky color.',
    '- A thin horizon silhouette fills ONLY the BOTTOM 18–22% of the canvas across the full width, touching the left, right, and bottom inner edges — this is part of the printed artwork, NOT a cut outline.',
    '- Optional: a few small clouds / stars / birds ONLY in the top half of the canvas.',
    '- ABSOLUTELY NO #FF00FF magenta anywhere on L5 — it is a print-only layer with no chroma-key.',
  ].join('\n'),
}

/**
 * Optional suggested palette for manual re-coloring. The app NO LONGER forces
 * this on exports by default — each layer's actual ink color is sampled from
 * its raster during vectorization and preserved in `layer.color`. This list
 * is just a convenience for users who want to tint layers differently to
 * match their physical paper stock.
 */
export const SUGGESTED_COLORS = [
  '#000000', '#e11d48', '#f97316', '#eab308',
  '#22c55e', '#0ea5e9', '#6366f1', '#a855f7',
  '#ffffff', '#64748b',
]

function extractGatewayError(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.message === 'string' && data.message.trim()) {
    const code = data.code != null ? `[${data.code}] ` : ''
    return `${code}${data.message}`.trim()
  }
  if (typeof data.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message
  }
  return ''
}

function isProviderUnavailableError(error) {
  const msg = String(error?.message || '')
  return msg.includes('未找到可用提供商') || msg.includes('40003')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function withTimeout(promise, timeoutMs, label) {
  let timer = null
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

function isTransientFetchError(error) {
  const msg = String(error?.message || '').toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    msg.includes('network error')
  )
}

async function post(path, body, timeoutMs = 90000) {
  const url = `${BASE}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    })
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(`请求超时（>${Math.round(timeoutMs / 1000)}s）：${body?.model || 'unknown'}`)
    }
    throw new Error(`网络错误：${e.message}`)
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch (_) {}
    throw new Error(`HTTP ${res.status}：${detail.slice(0, 400)}`)
  }
  const data = await res.json()
  const businessError = extractGatewayError(data)
  if (businessError) throw new Error(businessError)
  return data
}

/**
 * Call the text LLM to expand a short user prompt into 5-layer sculpture prompts.
 * Returns an array of 6 { id, prompt } objects.
 */
export async function refineSculpturePrompt(userInput) {
  const input = String(userInput || '').trim()
  if (!input) throw new Error('请输入提示词')

  const errors = []
  for (const model of TEXT_MODEL_CANDIDATES) {
    try {
      const data = await post('/v1/chat/completions', {
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SCULPTURE_SYSTEM },
          { role: 'user',   content: `User input: ${input}\nRefine it and output exactly 5 layers.` },
        ],
      }, 90000)

      const content =
        data?.choices?.[0]?.message?.content ||
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.content?.[0]?.text ||
        ''
      if (!content) { errors.push(`${model} 返回空`); continue }

      const parsed = parseLayerResponse(content)
      if (parsed.length === 5) return { raw: content, layers: parsed }
      errors.push(`${model} 解析不足 5 层（${parsed.length}）`)
    } catch (e) {
      errors.push(`${model}: ${e.message}`)
      if (!isProviderUnavailableError(e)) throw new Error(`润色失败：${e.message}`)
    }
  }
  throw new Error(`润色失败：${errors.join('；')}`)
}

function parseLayerResponse(text) {
  const result = []
  const regex = /Layer\s*(\d+)\s*[:：]\s*([\s\S]*?)(?=Layer\s*\d+\s*[:：]|$)/gi
  let m
  while ((m = regex.exec(text)) !== null) {
    const id = parseInt(m[1], 10)
    const prompt = m[2].trim().replace(/\n{3,}/g, '\n\n')
    if (id >= 1 && id <= 5 && prompt) {
      result.push({ id, prompt })
    }
  }
  return result.sort((a, b) => a.id - b.id).slice(0, 5)
}

/**
 * Supported panel aspect ratios. banana2 accepts these strings directly via
 * its `aspect_ratio` input, and we render the reference black frame on the
 * fly to match — no pre-baked PNGs needed.
 */
export const SUPPORTED_ASPECT_RATIOS = ['1:1', '16:9', '4:3']

/**
 * Compute pixel dimensions for a given aspect ratio, keeping the long side
 * at `longSide`. Used by both the runtime frame builder and the SVG export
 * helpers so the canvas, the print bitmap, and the laser-cut path all agree
 * on one canonical coordinate system.
 */
export function getCanvasSize(aspectRatio = '1:1', longSide = 1024) {
  const [awRaw, ahRaw] = String(aspectRatio).split(':').map(Number)
  const aw = awRaw > 0 ? awRaw : 1
  const ah = ahRaw > 0 ? ahRaw : 1
  if (aw >= ah) return { W: longSide, H: Math.round(longSide * ah / aw) }
  return { W: Math.round(longSide * aw / ah), H: longSide }
}

/**
 * Unify the export-size option set across buildGroupedSvg / buildUvCutSvg /
 * buildUvCutGroupedSvg. Preference order:
 *   1) explicit `W` + `H`
 *   2) explicit `aspectRatio` (+ optional `longSide`)
 *   3) legacy `targetSize` (square)
 *   4) infer from the first layer's SVG viewBox
 *   5) fallback 1024²
 */
function resolveExportSize(opts = {}, layers = []) {
  if (opts.W && opts.H) return { W: opts.W, H: opts.H }
  if (opts.aspectRatio) return getCanvasSize(opts.aspectRatio, opts.longSide || 1024)
  if (opts.targetSize) return { W: opts.targetSize, H: opts.targetSize }
  const sample = (layers || []).find(l => l && typeof l.svg === 'string' && l.svg.trim())
  if (sample) {
    try {
      const { viewBox } = splitSvg(sample.svg)
      const [, , vw, vh] = viewBox.split(/\s+/).map(Number)
      if (vw > 0 && vh > 0) return { W: Math.round(vw), H: Math.round(vh) }
    } catch { /* fall through */ }
  }
  return { W: 1024, H: 1024 }
}

/**
 * Programmatically draw the canonical thick black outer frame at the requested
 * aspect ratio. The inside is pure white, the border is a solid black
 * rectangle roughly 0.6 % of the long side (matches the hand-tuned thickness
 * of the original 1024² PNG). This is used as:
 *   - the reference image fed to banana2 for every layer, AND
 *   - the pixel-perfect overlay stamped back on during post-processing.
 */
export function buildBlackFrameDataUrl(aspectRatio = '1:1', {
  longSide = 1024,
  strokePx,
  transparentInterior = false,
} = {}) {
  const [awRaw, ahRaw] = String(aspectRatio).split(':').map(Number)
  const aw = awRaw > 0 ? awRaw : 1
  const ah = ahRaw > 0 ? ahRaw : 1
  let W, H
  if (aw >= ah) {
    W = longSide
    H = Math.round(longSide * ah / aw)
  } else {
    H = longSide
    W = Math.round(longSide * aw / ah)
  }
  // Thick frame (~3.5% of the shorter side) — the thicker the frame, the
  // more forcefully banana2 treats it as a hard boundary and the smaller the
  // drawable area, which in turn leaves less room for the model to hide a
  // white "passepartout" margin between its content and the frame.
  const t = Math.max(8, Math.round(strokePx || Math.min(W, H) * 0.035))
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!transparentInterior) {
    // Interior is pure magenta #FF00FF (same chroma-key color the AI must use
    // around its silhouette). This is deliberate — if the interior were white,
    // banana2 would treat it as "empty canvas" and often paint its content
    // inset from the frame, leaving a visible white ring. With magenta as the
    // interior baseline, the AI sees the chroma-key pattern it must preserve
    // (for L1–L4) or replace edge-to-edge (for L5 sky), and there is no
    // ambiguity about where the drawable area ends — it ends exactly at the
    // inner edge of the black frame.
    ctx.fillStyle = CHROMA_KEY_HEX
    ctx.fillRect(0, 0, W, H)
  }
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, t)
  ctx.fillRect(0, H - t, W, t)
  ctx.fillRect(0, 0, t, H)
  ctx.fillRect(W - t, 0, t, H)
  return canvas.toDataURL('image/png')
}

/**
 * Display-only frame: black border, transparent interior. Used by the 3D
 * preview so the user always sees the physical frame even before any layer
 * has been generated, WITHOUT the magenta chroma-key leaking into the UI.
 */
export function buildDisplayFrameDataUrl(aspectRatio = '1:1', opts = {}) {
  return buildBlackFrameDataUrl(aspectRatio, { ...opts, transparentInterior: true })
}

/**
 * Legacy entry point — the historical 1:1 frame was a pre-baked PNG shipped
 * in `src/assets/black-frame.png`. We now generate the frame at runtime.
 * No caching: the frame recipe (thickness, interior color) may evolve, and
 * rebuilding on every call avoids serving a stale version after code edits.
 */
export function getFixedFrameDataUrl() {
  return Promise.resolve(buildBlackFrameDataUrl('1:1'))
}
// retain the import reference so bundlers still emit the asset for anyone
// linking to it externally; unused at runtime.
void blackFrameUrl

/**
 * Generate a single layer image using nano-banana-2 edit,
 * using the fixed black frame as the structural reference image.
 */
export async function generateSculptureLayer(layerIndex, layerPrompt, frameDataUrl, {
  aspectRatio = '1:1',
} = {}) {
  if (!FAL_KEY) throw new Error('未配置 VITE_FAL_KEY')
  const budget = LAYER_OCCUPANCY_BUDGETS[layerIndex] || LAYER_OCCUPANCY_BUDGETS[1]
  const ratioWord = ({ '1:1': 'square', '16:9': 'widescreen 16:9 landscape', '4:3': '4:3 landscape' })[aspectRatio] || aspectRatio
  const stageContext = [
    'STAGE CONTEXT (your layer is ONE slice of a 5-layer stacked paper diorama — the other 4 slices fill the rest of the scene, so DO NOT redraw them here):',
    '- L1 (front) : low grass / stones / pebbles in the bottom 16–20% ONLY (ankle-height); magenta above.',
    '- L2        : two narrow tree / pillar side frames FUSED to the left and right inner frame edges (leftmost 19% and rightmost 19% of width, no magenta gap between the pillar and the frame); entire middle 62% of width is magenta.',
    '- L3        : ground strip in bottom 20–24% + ONE SMALL hero (≤ 38% width, ≤ 32% height, top edge ≥ 44% from top) horizontally centered; everything else magenta.',
    '- L4        : TALLEST cut landscape — mid-distance hills + mountains + optional small houses, peaks ≤ 45% from top and placed OFF-CENTER, with a VALLEY at horizontal center dropping to ~55% so L5\'s sun is never blocked; magenta above.',
    '- L5 (back) : full sky — SMOOTH soft gradient (NOT hard stripes), sun/moon HIGH (disc bottom ≥ 35% from top) centered above L4\'s center valley, plus a low thin horizon strip; print only, no chroma-key.',
    `You are drawing L${layerIndex}. Stay strictly inside your slice, leave the rest of the canvas pure magenta (or real sky for L5) so the other layers show through.`,
  ].join('\n')
  const prompt = [
    `Generate Layer ${layerIndex} of a 5-layer UV-print + laser-cut layered-sculpture composition.`,
    '',
    `CANVAS SHAPE: ${ratioWord} (aspect ratio ${aspectRatio}). The reference image shows exactly what the output canvas looks like: a THICK solid BLACK rectangular outer frame occupying roughly the outer 3.5% of the shorter side on each side (a very visible, heavy border), and the ENTIRE interior of that frame is flood-filled with PURE MAGENTA #FF00FF (edge-to-edge, touching the inner edge of the black frame with NO margin of any kind, NO white gap, NO padding). Treat the inner edge of that thick black frame as a hard physical wall — your drawable area ENDS there.`,
    '',
    'REFERENCE PRESERVATION (non-negotiable):',
    '- The output MUST keep the THICK black outer frame EXACTLY as in the reference — same thickness, same position, full-bleed to the canvas edges. Do NOT draw a thinner frame, do NOT inset it, do NOT add any additional inner or outer border.',
    layerIndex === 5
      ? '- REPLACE all the magenta interior with your real sky content. Your sky / horizon painting must extend FULLY to the inner edge of the black frame on all four sides — there is NO white or unpainted margin between your sky and the frame. Do NOT shrink the content into a smaller rectangle inside the frame. Do NOT leave ANY magenta pixels in the output — repaint every one of them with real sky.'
      : '- The magenta interior in the reference is the CHROMA-KEY background; preserve it AS-IS and paint your silhouette content ON TOP of it. Do NOT convert magenta to white. Do NOT shrink the drawable area inward, leaving a white ring between the frame and the magenta — that ring is WRONG. Magenta must still touch the inner edge of the black frame on all four sides wherever your silhouette does not cover it.',
    '- NEVER introduce any white / off-white / light-gray margin, padding, inner border, mat, or passepartout between the black outer frame and the interior content. If you find yourself "centering" content with breathing room around it, STOP — the content fills the frame edge-to-edge.',
    '',
    stageContext,
    '',
    `LAYER ${layerIndex} OCCUPANCY BUDGET (HARD RULE — the most important constraint, overrides anything else that conflicts with it):`,
    budget,
    '',
    'OUTPUT FORMAT (critical — the image is used as a UV-print + laser-cut panel):',
    layerIndex === 5
      ? '- Layer 5 is PRINT-ONLY. The ENTIRE canvas (inside the outer black frame) is real sky content. DO NOT use #FF00FF magenta anywhere — this layer has no chroma-key and no laser-cut silhouette.'
      : '- This layer consists of a SILHOUETTE SHAPE (the colored content that stays after cutting) surrounded by a PURE MAGENTA #FF00FF chroma-key background (R=255, G=0, B=255). Post-processing will key out exactly #FF00FF to transparent — so the magenta MUST be EXACTLY that color, with pixel-sharp hard edges against the silhouette.',
    '- INSIDE the silhouette: flat-color illustration content — vivid but simple, like a children-book cutout or a flat vector illustration. Distinct solid-color regions separated by sharp boundaries. No dense line work, no small text, no heavy texture.',
    layerIndex === 5
      ? '- Sky gradient + sun/moon disc + optional low horizon strip. Smooth soft gradient, NOT hard stripes.'
      : '- OUTSIDE the silhouette: flood-fill with pure magenta #FF00FF. NEVER use near-magenta, NEVER use hot-pink, NEVER use white — exactly #FF00FF so the chroma-key matches perfectly. NEVER use magenta or hot-pink INSIDE the silhouette either.',
    '- The BOUNDARY between silhouette content and the exterior must be pixel-sharp. No anti-aliased bleed, no faint outline ring, no halo.',
    layerIndex === 5
      ? null
      : '- ABSOLUTELY NO WHITE OUTLINE / WHITE STROKE / WHITE RIM around the silhouette. Do NOT add a white border, white glow, white highlight ring, rim-light, cartoon outline stroke, or any light-colored decorative edge between the colored silhouette and the magenta background. The interior silhouette color must sit DIRECTLY against pure magenta #FF00FF with no intermediate outline of any kind. If your illustration style instinct is to add a white stroke for readability, DO NOT do it here — the layer is a laser-cut silhouette and the white stroke will create unwanted cut paths and visible halos.',
    '',
    'ABSOLUTE RULES:',
    '1) STAY STRICTLY WITHIN THE OCCUPANCY BUDGET ABOVE. If your drawing extends outside the allowed region, it will hide the layers behind and ruin the stacked sculpture. Visualize the bounding rectangle first, then compose inside it.',
    layerIndex === 3
      ? '1a) HERO-SIZE WARNING: On Layer 3 the hero MUST be drawn as a SMALL figurine — width ≤ 38% of canvas width, height ≤ 32% of canvas height. It is NEVER a close-up, NEVER a portrait, NEVER fills the canvas. The top 44% of the canvas and the left/right 31% of width around the hero stay pure magenta.'
      : null,
    '2) Keep flat-color illustration style throughout (think "Pixar flat cutout" / storybook illustration). No photorealism, no complex gradient, no fine detail that would not UV-print cleanly.',
    '3) The SILHOUETTE OUTLINE follows classic papercut rules: clean, bold, readable shapes. Fill the interior with colors (not black), but the outer silhouette must be as crisp as a papercut.',
    '4) NO FLOATING ELEMENTS. Anything that would float in air MUST sit on or connect to another silhouette that reaches the left / right inner edges of the outer frame, or connect directly to the outer frame.',
    '5) BOTTOM FLOOD-FILL RULE: if this layer has ANY silhouette element in its lower half, the silhouette must extend DOWN to the bottom inner edge of the outer frame as ONE continuous connected shape, touching the bottom inner edge continuously from left inner edge to right inner edge — NO magenta gap at the bottom.',
    '6) Fill the inner composition edge-to-edge where required (ground strip, horizon, skyline must reach both inner side edges AND the bottom inner edge). Do NOT leave tiny gaps at the left, right, or bottom of any base/horizon region.',
    '7) No text, watermark, signature, logo, grid lines, arrows, frame-inside-frame, or extra decoration.',
    '',
    'LAYER-SPECIFIC PROMPT:',
    layerPrompt,
  ].filter(Boolean).join('\n')

  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await withTimeout(
        fal.subscribe(BANANA2_ENDPOINT, {
          input: {
            prompt,
            image_urls: [frameDataUrl],
            num_images: 1,
            aspect_ratio: aspectRatio,
            output_format: 'png',
            resolution: '1K',
            limit_generations: true,
          },
          logs: false,
        }),
        300000,
        'banana2 超时（>300s）',
      )
      const url = result?.data?.images?.[0]?.url
      if (!url) throw new Error('banana2 返回无图')
      return url
    } catch (e) {
      const retriable = isTransientFetchError(e)
      const isLast = attempt >= maxAttempts
      if (!retriable || isLast) throw new Error(`Layer ${layerIndex} 生成失败：${e.message}`)
      await sleep(800 * attempt)
    }
  }
}

/**
 * The chroma-key color used as the "outside the silhouette" marker by the
 * AI output for layers 1–4. Chosen as pure magenta because it essentially
 * never appears in natural landscape / character illustrations, so plain
 * color-distance matching produces perfect silhouette masks without any
 * heuristics. Layer 5 is print-only and does NOT use this key.
 *
 * This same color is ALSO used as the INTERIOR of the reference black frame
 * passed to banana2 — so the AI sees "magenta flood-fills every pixel inside
 * the black frame, edge-to-edge". That way the model never interprets a
 * neutral white interior as "empty canvas with invisible margin" and always
 * extends its silhouette / sky all the way to the inner edge of the frame.
 */
export const CHROMA_KEY_RGB = { r: 255, g: 0, b: 255 }
export const CHROMA_KEY_HEX = '#FF00FF'

/**
 * Post-process a layer's raw banana2 output:
 *   1) Overlay the canonical black outer frame pixel-perfect.
 *   2) For layers 1–4: chroma-key out the magenta background so the
 *      silhouette content becomes opaque and everything that was #FF00FF
 *      becomes transparent (stacks under the next layer).
 *   3) For layer 5 (print-only): keep every pixel opaque — L5 is the
 *      backmost solid-fill sky, no transparency anywhere except the
 *      black frame.
 *
 * The chroma-key match is a simple Euclidean RGB distance to pure magenta,
 * with a tolerance wide enough to catch anti-aliased edge pixels that
 * blended the key color with neighbouring content.
 */
export async function composeWithFixedFrame(rawImageSource, frameDataUrl, { layerId } = {}) {
  const [rawDataUrl, frameSrc] = await Promise.all([
    toDataUrl(rawImageSource),
    toDataUrl(frameDataUrl),
  ])
  const [rawImg, frameImg] = await Promise.all([
    loadImage(rawDataUrl),
    loadImage(frameSrc),
  ])

  const W = frameImg.width
  const H = frameImg.height

  const frameCanvas = document.createElement('canvas')
  frameCanvas.width = W; frameCanvas.height = H
  const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true })
  fCtx.drawImage(frameImg, 0, 0, W, H)
  const frameData = fCtx.getImageData(0, 0, W, H).data

  const rawCanvas = document.createElement('canvas')
  rawCanvas.width = W; rawCanvas.height = H
  const rCtx = rawCanvas.getContext('2d', { willReadFrequently: true })
  rCtx.drawImage(rawImg, 0, 0, W, H)
  const rawData = rCtx.getImageData(0, 0, W, H).data

  const out = document.createElement('canvas')
  out.width = W; out.height = H
  const oCtx = out.getContext('2d', { willReadFrequently: true })
  const outImg = oCtx.createImageData(W, H)
  const px = outImg.data

  const frameLumThreshold = 90
  const isPrintOnlyLayer = layerId === 5
  const { r: kR, g: kG, b: kB } = CHROMA_KEY_RGB
  // Squared distance cutoff for "this pixel is magenta (or the anti-aliased
  // fringe of magenta)". 80² ≈ 6400 catches the edge-blend band without
  // swallowing real colors. Also require the pixel to be "pink-ish" — high
  // red AND high blue, low-ish green — to avoid accidentally keying out
  // saturated reds or blues.
  const keyDistSq = 80 * 80

  // Frame mask — 1 where the canonical outer black frame lives.
  const isFrame = new Uint8Array(W * H)
  for (let p = 0; p < W * H; p += 1) {
    const fLum = 0.299 * frameData[p * 4] + 0.587 * frameData[p * 4 + 1] + 0.114 * frameData[p * 4 + 2]
    if (fLum < frameLumThreshold) isFrame[p] = 1
  }

  for (let i = 0; i < frameData.length; i += 4) {
    const p = i >> 2
    if (isFrame[p]) {
      px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 255
      continue
    }
    const r = rawData[i], g = rawData[i + 1], b = rawData[i + 2]
    if (!isPrintOnlyLayer) {
      const dr = r - kR, dg = g - kG, db = b - kB
      const d2 = dr * dr + dg * dg + db * db
      const pinkish = r >= 180 && b >= 180 && g <= 120 && (r + b) > 2 * g
      if (d2 <= keyDistSq || pinkish) {
        px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 0
        continue
      }
    }
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255
  }

  // ────── FRAME-MARGIN CLEANUP (all layers) ──────
  // banana2 sometimes paints a thin "passepartout" ring of near-white (and,
  // on L5, residual magenta) between the outer black frame and the real
  // content, even though the reference image has the interior filled edge-
  // to-edge with magenta. Detect that ring by BFS-flood-filling inward from
  // any frame-adjacent pixel through connected near-white / near-magenta
  // opaque pixels. Interior white elements (clouds, eyes, petals) are NOT
  // connected to the frame through near-white, so they are safe.
  //
  //   L1–L4: margin pixels get alpha=0 (they should have been the chroma-key
  //          background anyway).
  //   L5    : margin pixels are repainted with the color of the nearest
  //          real content pixel, so the sky extends edge-to-edge.
  const isMarginColor = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2]
    if (r >= 230 && g >= 230 && b >= 230) return true
    if (r >= 200 && b >= 200 && g <= 120 && (r + b) > 2 * g) return true
    return false
  }
  const margin = new Uint8Array(W * H)
  const mQueue = []
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const p = y * W + x
      if (isFrame[p]) continue
      const i = p * 4
      if (px[i + 3] === 0) continue
      if (!isMarginColor(i)) continue
      let adjFrame = false
      if (x > 0 && isFrame[p - 1]) adjFrame = true
      else if (x < W - 1 && isFrame[p + 1]) adjFrame = true
      else if (y > 0 && isFrame[p - W]) adjFrame = true
      else if (y < H - 1 && isFrame[p + W]) adjFrame = true
      if (adjFrame) {
        margin[p] = 1
        mQueue.push(p)
      }
    }
  }
  let mHead = 0
  while (mHead < mQueue.length) {
    const p = mQueue[mHead++]
    const y = (p / W) | 0
    const x = p - y * W
    const neigh = []
    if (x > 0)       neigh.push(p - 1)
    if (x < W - 1)   neigh.push(p + 1)
    if (y > 0)       neigh.push(p - W)
    if (y < H - 1)   neigh.push(p + W)
    for (const q of neigh) {
      if (isFrame[q] || margin[q]) continue
      const qi = q * 4
      if (px[qi + 3] === 0) continue
      if (!isMarginColor(qi)) continue
      margin[q] = 1
      mQueue.push(q)
    }
  }

  if (isPrintOnlyLayer) {
    // Repaint each margin pixel with the nearest real (non-margin, non-
    // frame, opaque) interior color. BFS outward from non-margin pixels
    // that touch a margin neighbour.
    const assigned = new Uint8Array(W * H)
    let frontier = []
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const p = y * W + x
        if (isFrame[p] || margin[p]) continue
        assigned[p] = 1
        let isEdge = false
        if      (x > 0       && margin[p - 1]) isEdge = true
        else if (x < W - 1   && margin[p + 1]) isEdge = true
        else if (y > 0       && margin[p - W]) isEdge = true
        else if (y < H - 1   && margin[p + W]) isEdge = true
        if (isEdge) frontier.push(p)
      }
    }
    while (frontier.length) {
      const next = []
      for (let k = 0; k < frontier.length; k += 1) {
        const p = frontier[k]
        const y = (p / W) | 0
        const x = p - y * W
        const si = p * 4
        const sr = px[si], sg = px[si + 1], sb = px[si + 2]
        const neigh = []
        if (x > 0)       neigh.push(p - 1)
        if (x < W - 1)   neigh.push(p + 1)
        if (y > 0)       neigh.push(p - W)
        if (y < H - 1)   neigh.push(p + W)
        for (const q of neigh) {
          if (isFrame[q] || !margin[q] || assigned[q]) continue
          assigned[q] = 1
          const qi = q * 4
          px[qi] = sr; px[qi + 1] = sg; px[qi + 2] = sb; px[qi + 3] = 255
          next.push(q)
        }
      }
      frontier = next
    }
  } else {
    for (let p = 0; p < W * H; p += 1) {
      if (!margin[p]) continue
      const i = p * 4
      px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 0
    }
  }

  // ────── SILHOUETTE HALO CLEANUP (L1–L4 only) ──────
  // banana2's flat-illustration style often paints a thin WHITE OUTLINE
  // stroke directly around each silhouette (rim light / cartoon outline).
  // Those pixels aren't connected to the outer frame, so the frame-margin
  // pass above doesn't touch them. We erode them here by checking near-white
  // opaque pixels that TOUCH a transparent neighbour (the former magenta
  // chroma-key around the silhouette). Interior near-white content (clouds,
  // eyes, petals) stays safe because it isn't adjacent to transparency.
  //
  // Frame pixels and L5 (print-only, no transparency to erode against) are
  // untouched.
  if (!isPrintOnlyLayer) {
    const halfIter = 3
    const alphaSnap = new Uint8Array(W * H)
    for (let iter = 0; iter < halfIter; iter += 1) {
      for (let p = 0; p < W * H; p += 1) alphaSnap[p] = px[p * 4 + 3]
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          const p = y * W + x
          if (alphaSnap[p] === 0) continue
          const i = p * 4
          const r = px[i], g = px[i + 1], b = px[i + 2]
          if (r < 225 || g < 225 || b < 225) continue
          let touches = false
          if      (x > 0       && alphaSnap[p - 1] === 0) touches = true
          else if (x < W - 1   && alphaSnap[p + 1] === 0) touches = true
          else if (y > 0       && alphaSnap[p - W] === 0) touches = true
          else if (y < H - 1   && alphaSnap[p + W] === 0) touches = true
          if (touches) {
            px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 0
          }
        }
      }
    }
  }

  oCtx.putImageData(outImg, 0, 0)
  return out.toDataURL('image/png')
}

async function toDataUrl(src) {
  if (!src) throw new Error('empty image source')
  if (String(src).startsWith('data:')) return src
  const res = await fetch(src)
  if (!res.ok) throw new Error(`下载图片失败：HTTP ${res.status}`)
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('加载图片失败'))
    el.src = src
  })
}

/**
 * Sample the dominant "ink" color from a raster image: the average RGB of all
 * non-white, non-transparent pixels. Returns { r, g, b } or null if the image
 * has no non-white content.
 */
function sampleInkColor(imageData, whiteThreshold = 240) {
  const { data } = imageData
  let rSum = 0, gSum = 0, bSum = 0, n = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 16) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) continue
    rSum += r; gSum += g; bSum += b; n += 1
  }
  if (!n) return null
  return { r: Math.round(rSum / n), g: Math.round(gSum / n), b: Math.round(bSum / n) }
}

function rgbToHex({ r, g, b }) {
  const h = (v) => v.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/**
 * Vectorize the SILHOUETTE of a layer image into a single-color SVG cut
 * path. The input is expected to be a composed layer image (alpha channel
 * indicates silhouette vs. outside — see `composeWithFixedFrame`), but the
 * routine gracefully falls back to a luminance threshold when no alpha is
 * present.
 *
 * The SVG output is ONE color (for laser-cut / CNC), defaulting to black.
 * We also sample the dominant interior color for informational display
 * (used as a hint in the UI); this is NOT applied to the SVG by default.
 *
 * @param {string|Image} imageSource  PNG data URL or HTMLImageElement
 * @param {object}      [opts]
 * @param {number}      [opts.threshold=160]  fallback luminance threshold
 * @param {string}      [opts.cutColor='#000000']  color used for the cut path
 * @param {boolean}     [opts.useAlpha=true] prefer alpha channel if present
 * @returns {{svg: string, color: string}} cut-path SVG + sampled interior color
 */
export async function vectorizeImage(imageSource, {
  cutColor = '#000000',
  maxSize = 1024,
  smoothing = 0.8,
  erodePx = 1,
  pathomit = 4,
  ltres = 0.5,
  qtres = 0.5,
} = {}) {
  const dataUrl = await toDataUrl(imageSource)
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const W = Math.max(1, Math.round(img.width * scale))
  const H = Math.max(1, Math.round(img.height * scale))
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.clearRect(0, 0, W, H)
  ctx.drawImage(img, 0, 0, W, H)

  const data = ctx.getImageData(0, 0, W, H)
  const sampled = sampleInkColor(data) || { r: 0, g: 0, b: 0 }
  const interiorHex = rgbToHex(sampled)

  const cut = hexToRgb(cutColor) || { r: 0, g: 0, b: 0 }
  const px = data.data

  // The raster was pre-processed by composeWithFixedFrame: magenta (the
  // chroma-key background) is already fully transparent, and every
  // silhouette pixel is fully opaque. So alpha alone is a perfect mask —
  // no luminance or saturation heuristics needed.
  const mask = new Uint8Array(W * H)
  for (let i = 0, p = 0; i < px.length; i += 4, p += 1) {
    mask[p] = px[i + 3] >= 128 ? 255 : 0
  }

  // Strip the canonical black outer frame from the mask. composeWithFixedFrame
  // stamps the frame as a ring of pure-black opaque pixels at the canvas
  // edge; it is a structural decoration shared by all layers, NOT something
  // to be laser-cut. If we left it in, ImageTracer would add an extra outer
  // rectangle to every layer's cut path.
  //
  // We only touch pixels within a thin edge band (≈1.8 % of the short side
  // plus a small safety margin) so pure-black illustration details in the
  // middle of the canvas are preserved untouched.
  const frameZone = Math.max(6, Math.round(Math.min(W, H) * 0.018))
  for (let y = 0; y < H; y += 1) {
    const inBorderRow = y < frameZone || y >= H - frameZone
    for (let x = 0; x < W; x += 1) {
      if (!inBorderRow && x >= frameZone && x < W - frameZone) continue
      const p = y * W + x
      if (!mask[p]) continue
      const i = p * 4
      if (px[i] <= 12 && px[i + 1] <= 12 && px[i + 2] <= 12) {
        mask[p] = 0
      }
    }
  }

  // Erode inward to fully eat any remaining 1-pixel halo sliver.
  let tight = mask
  for (let i = 0; i < erodePx; i += 1) {
    tight = erodeMask(tight, W, H)
  }

  // Then a tiny blur smooths pixel staircases so imagetracer produces
  // gentle Bezier curves instead of jagged polylines — without pushing
  // the boundary back outward (because we erode first).
  const smoothed = smoothing > 0 ? boxBlurMask(tight, W, H, smoothing) : tight

  for (let p = 0, i = 0; p < smoothed.length; p += 1, i += 4) {
    const v = smoothed[p]
    const t = v / 255
    px[i]     = Math.round(cut.r * t + 255 * (1 - t))
    px[i + 1] = Math.round(cut.g * t + 255 * (1 - t))
    px[i + 2] = Math.round(cut.b * t + 255 * (1 - t))
    px[i + 3] = 255
  }
  ctx.putImageData(data, 0, 0)

  const options = {
    numberofcolors: 2,
    mincolorratio: 0,
    colorsampling: 0,
    pathomit,
    ltres,
    qtres,
    rightangleenhance: false,
    strokewidth: 0,
    linefilter: true,
    blurradius: 0,
    palette: [
      { r: cut.r, g: cut.g, b: cut.b, a: 255 },
      { r: 255,   g: 255,   b: 255,   a: 255 },
    ],
    viewbox: true,
    roundcoords: 2,
  }
  const svgstr = ImageTracer.imagedataToSVG(
    ImageTracer.getImgdata(canvas),
    options,
  )
  const cleaned = cleanVectorSvg(svgstr)
  return { svg: cleaned, color: interiorHex }
}

/**
 * Extract ONE clean cut path from a layer bitmap, ready to drop into a
 * fabrication SVG. Unlike `vectorizeImage` (which is tuned for the on-screen
 * vector preview), this routine is dedicated to laser-cut output:
 *
 *   1. Re-traces from the layer's bitmap on every call — never reuses the
 *      cached `layer.svg`. So even if the user re-generates a layer and
 *      forgets to re-vectorize, the cut still matches the freshest bitmap.
 *   2. Uses the alpha channel directly with NO erosion / NO smoothing, so
 *      the cut hugs the silhouette pixel-for-pixel (the previous pipeline
 *      eroded by 1px which made the cut visibly inset from the bitmap).
 *   3. The canonical outer black frame is stripped from the silhouette
 *      trace (otherwise imagetracer would emit a fat, messy poly-rectangle
 *      around every layer) and re-added as ONE explicit `<rect>` cut that
 *      follows the OUTER edge of the frame at the canvas perimeter. This
 *      gives every layer a clean rectangular perimeter cut AND preserves
 *      the interior silhouette cuts.
 *   4. Parses the imagetracer output via DOMParser instead of regex, so
 *      silhouette paths are reliably kept and white background paths are
 *      reliably dropped — independent of how imagetracer happens to
 *      stringify (`<path/>` vs `<path></path>`, `rgb(255,255,255)` vs
 *      `#ffffff`, etc.).
 *
 * @param {string|Image} imageSource  PNG data URL or HTMLImageElement
 * @param {object} [opts]
 * @param {string} [opts.cutColor='#ff0000']  stroke color of the cut path
 * @param {number} [opts.strokeWidth=0.5]     SVG stroke-width for the cut
 * @param {number} [opts.maxSize=1024]        max edge for tracing canvas
 * @param {number} [opts.pathomit=8]          drop tiny paths (< pathomit px)
 * @param {number} [opts.ltres=1.0]
 * @param {number} [opts.qtres=1.0]
 * @returns {Promise<{ inner: string, viewBox: string, W: number, H: number }>}
 */
export async function extractCutPathInner(imageSource, {
  cutColor = '#ff0000',
  strokeWidth = 0.5,
  maxSize = 1024,
  pathomit = 8,
  ltres = 1.0,
  qtres = 1.0,
} = {}) {
  const dataUrl = await toDataUrl(imageSource)
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const W = Math.max(1, Math.round(img.width * scale))
  const H = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.clearRect(0, 0, W, H)
  ctx.drawImage(img, 0, 0, W, H)

  const data = ctx.getImageData(0, 0, W, H)
  const px = data.data

  const frameZone = Math.max(6, Math.round(Math.min(W, H) * 0.018))
  const TRACE_BLACK = { r: 0, g: 0, b: 0 }
  const TRACE_WHITE = { r: 255, g: 255, b: 255 }

  for (let y = 0; y < H; y += 1) {
    const inBorderRow = y < frameZone || y >= H - frameZone
    for (let x = 0; x < W; x += 1) {
      const p = (y * W + x) * 4
      const a = px[p + 3]
      const inBorderCol = x < frameZone || x >= W - frameZone
      let isInk = a >= 128
      if (isInk && (inBorderRow || inBorderCol)) {
        if (px[p] <= 12 && px[p + 1] <= 12 && px[p + 2] <= 12) isInk = false
      }
      const c = isInk ? TRACE_BLACK : TRACE_WHITE
      px[p] = c.r; px[p + 1] = c.g; px[p + 2] = c.b; px[p + 3] = 255
    }
  }
  ctx.putImageData(data, 0, 0)

  const svgstr = ImageTracer.imagedataToSVG(
    ImageTracer.getImgdata(canvas),
    {
      numberofcolors: 2,
      mincolorratio: 0,
      colorsampling: 0,
      pathomit,
      ltres,
      qtres,
      rightangleenhance: false,
      strokewidth: 0,
      linefilter: true,
      blurradius: 0,
      palette: [
        { r: 0,   g: 0,   b: 0,   a: 255 },
        { r: 255, g: 255, b: 255, a: 255 },
      ],
      viewbox: true,
      roundcoords: 2,
    },
  )

  const { inner, viewBox } = splitSvg(svgstr)
  const silhouettePaths = filterSilhouettePaths(inner, cutColor, strokeWidth)

  // Every fabrication layer needs an outer-perimeter cut or the laser
  // cutter never actually releases the piece from the stock. We emit a
  // single <rect> that traces the canvas edge (= outer edge of the
  // canonical black frame), plus the interior silhouette cuts.
  const inset = strokeWidth / 2
  const rectX = inset
  const rectY = inset
  const rectW = Math.max(0, W - strokeWidth)
  const rectH = Math.max(0, H - strokeWidth)
  const frameRect =
    `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" ` +
    `fill="none" stroke="${cutColor}" stroke-width="${strokeWidth}" ` +
    `stroke-linejoin="miter"/>`

  const combined = silhouettePaths
    ? `${frameRect}\n      ${silhouettePaths}`
    : frameRect

  return { inner: combined, viewBox: viewBox || `0 0 ${W} ${H}`, W, H }
}

/**
 * Parse an imagetracer-style SVG inner snippet, KEEP only paths whose fill
 * is the silhouette color (anything that is not "white" / "none"), and emit
 * them as stroke-only outlines suitable for laser cutting.
 *
 * Uses DOMParser so we are immune to the many ways imagetracer might
 * stringify a path (self-closing vs. open-close, `rgb(255,255,255)` vs.
 * `#fff`, attribute ordering, etc.).
 */
function filterSilhouettePaths(inner, cutColor, strokeWidth) {
  if (!inner) return ''
  if (typeof DOMParser === 'undefined') {
    return inner.replace(/<path\b[^>]*\/>/gi, (m) => {
      if (/fill=("|')(?:none|white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\1/i.test(m)) return ''
      const dMatch = m.match(/\bd=("[^"]*"|'[^']*')/i)
      if (!dMatch) return ''
      return `<path d=${dMatch[1]} fill="none" stroke="${cutColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    })
  }
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
  const doc = new DOMParser().parseFromString(wrapped, 'image/svg+xml')
  const paths = Array.from(doc.querySelectorAll('path'))
  const out = []
  for (const node of paths) {
    const d = node.getAttribute('d')
    if (!d) continue
    const fill = (node.getAttribute('fill') || '').trim().toLowerCase()
    if (isWhiteFill(fill)) continue
    out.push(
      `<path d="${xmlAttr(d)}" fill="none" stroke="${cutColor}" ` +
      `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
  }
  return out.join('\n      ')
}

/**
 * Subtract the canonical outer black frame from a layer bitmap, returning a
 * new PNG data URL in which every pixel occupied by the frame is fully
 * transparent. The per-layer cut SVG already draws the frame as a vector
 * <rect>, so we don't want a second copy burnt into the UV print bitmap —
 * otherwise the exported "position marker frame" would be printed on top of
 * the acrylic AND cut through, which stacks badly.
 *
 * Implementation follows the user's suggestion literally: overlay the
 * bitmap with the reference frame image and wherever the frame is opaque
 * black, knock out the bitmap to transparent. This is an exact pixel-level
 * subtraction — it never touches a single pixel of in-frame content.
 *
 * @param {string|Image} bitmapSource  layer PNG (data URL or <img>)
 * @param {string}       aspectRatio   '1:1' | '16:9' | '4:3' — matches how
 *                                     the frame was baked when the layer
 *                                     was generated
 * @returns {Promise<string>} new PNG data URL, same dimensions as input
 */
async function stripFrameFromBitmap(bitmapSource, aspectRatio = '1:1') {
  const bmpUrl = await toDataUrl(bitmapSource)
  const bmpImg = await loadImage(bmpUrl)
  const W = bmpImg.width
  const H = bmpImg.height

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bmpImg, 0, 0, W, H)
  const bmpData = ctx.getImageData(0, 0, W, H)

  const frameUrl = buildBlackFrameDataUrl(aspectRatio, { longSide: Math.max(W, H) })
  const frameImg = await loadImage(frameUrl)
  const fCanvas = document.createElement('canvas')
  fCanvas.width = W; fCanvas.height = H
  const fCtx = fCanvas.getContext('2d', { willReadFrequently: true })
  fCtx.drawImage(frameImg, 0, 0, W, H)
  const fData = fCtx.getImageData(0, 0, W, H)

  const bpx = bmpData.data
  const fpx = fData.data
  for (let i = 0; i < bpx.length; i += 4) {
    // Frame pixel = near-pure-black & fully opaque in the reference.
    // Tolerant thresholds so downsampling / JPEG-ish re-encoding can't
    // skip a single edge pixel.
    if (
      fpx[i]     <= 12 &&
      fpx[i + 1] <= 12 &&
      fpx[i + 2] <= 12 &&
      fpx[i + 3] >= 200
    ) {
      bpx[i + 3] = 0
    }
  }
  ctx.putImageData(bmpData, 0, 0)
  return canvas.toDataURL('image/png')
}

function isWhiteFill(v) {
  if (!v) return false
  if (v === 'none' || v === 'white' || v === '#fff' || v === '#ffffff') return true
  const m = v.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]]
    return r >= 250 && g >= 250 && b >= 250
  }
  return false
}

/**
 * Morphological erosion by 1 pixel on a Uint8 mask — any pixel whose
 * 4-neighbourhood contains a zero becomes zero. Used to shrink the mask
 * inward slightly so the subsequent smooth-blur does not push the
 * silhouette boundary outward.
 */
function erodeMask(src, w, h) {
  const out = new Uint8Array(src.length)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x
      if (!src[p]) continue
      const up    = y > 0       ? src[p - w] : 0
      const down  = y < h - 1   ? src[p + w] : 0
      const left  = x > 0       ? src[p - 1] : 0
      const right = x < w - 1   ? src[p + 1] : 0
      out[p] = (up && down && left && right) ? 255 : 0
    }
  }
  return out
}

/**
 * Separable box blur on a single-channel Uint8 mask. Running several
 * small-radius passes approximates a Gaussian and is fast enough to be
 * run per-layer in the browser. Softens pixel staircases before tracing
 * so resulting Bezier curves hug the silhouette smoothly without jitter.
 */
function boxBlurMask(src, w, h, radius) {
  const r = Math.max(1, Math.round(radius))
  let buf = new Uint8Array(src)
  const tmp = new Uint8Array(src.length)
  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < h; y += 1) {
      let sum = 0
      const row = y * w
      for (let x = -r; x <= r; x += 1) sum += buf[row + clamp(x, 0, w - 1)]
      for (let x = 0; x < w; x += 1) {
        tmp[row + x] = (sum / (2 * r + 1)) | 0
        const xAdd = clamp(x + r + 1, 0, w - 1)
        const xSub = clamp(x - r, 0, w - 1)
        sum += buf[row + xAdd] - buf[row + xSub]
      }
    }
    for (let x = 0; x < w; x += 1) {
      let sum = 0
      for (let y = -r; y <= r; y += 1) sum += tmp[clamp(y, 0, h - 1) * w + x]
      for (let y = 0; y < h; y += 1) {
        buf[y * w + x] = (sum / (2 * r + 1)) | 0
        const yAdd = clamp(y + r + 1, 0, h - 1)
        const ySub = clamp(y - r, 0, h - 1)
        sum += tmp[yAdd * w + x] - tmp[ySub * w + x]
      }
    }
  }
  return buf
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v) }
}

function hexToRgb(hex) {
  if (!hex) return null
  const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function cleanVectorSvg(svg) {
  let out = svg
    .replace(/fill="rgb\(255,255,255\)"/g, 'fill="none"')
    .replace(/stroke="rgb\(255,255,255\)"/g, 'stroke="none"')
  return out
}

/**
 * Extract inner content (everything between <svg ...> and </svg>) and return
 * it plus the original viewBox / width / height attributes.
 */
function splitSvg(svgString) {
  if (!svgString) return { inner: '', viewBox: '0 0 1024 1024', width: null, height: null }
  const openMatch = svgString.match(/<svg\b[^>]*>/i)
  const closeIdx = svgString.lastIndexOf('</svg>')
  if (!openMatch || closeIdx < 0) {
    return { inner: svgString, viewBox: '0 0 1024 1024', width: null, height: null }
  }
  const openTag = openMatch[0]
  const inner = svgString.slice(openMatch.index + openTag.length, closeIdx).trim()

  const vbMatch   = openTag.match(/\bviewBox="([^"]+)"/i)
  const wMatch    = openTag.match(/\bwidth="([^"]+)"/i)
  const hMatch    = openTag.match(/\bheight="([^"]+)"/i)
  let viewBox = vbMatch ? vbMatch[1] : null
  const width  = wMatch ? wMatch[1] : null
  const height = hMatch ? hMatch[1] : null
  if (!viewBox && width && height) viewBox = `0 0 ${parseFloat(width)} ${parseFloat(height)}`
  if (!viewBox) viewBox = '0 0 1024 1024'
  return { inner, viewBox, width, height }
}

/**
 * Recolor every black fill/stroke in an SVG inner content to `color`.
 * Matches the common imagetracerjs outputs: fill="rgb(0,0,0)" | "#000" |
 * "#000000" | "black" (case-insensitive). White fills remain untouched
 * (cleanVectorSvg already converted them to fill="none").
 */
export function recolorSvgContent(inner, color) {
  if (!inner || !color) return inner
  return inner
    .replace(/fill="rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)"/gi,  `fill="${color}"`)
    .replace(/stroke="rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)"/gi,`stroke="${color}"`)
    .replace(/fill="#000000"/gi,                            `fill="${color}"`)
    .replace(/fill="#000"/gi,                               `fill="${color}"`)
    .replace(/fill="black"/gi,                              `fill="${color}"`)
    .replace(/stroke="#000000"/gi,                          `stroke="${color}"`)
    .replace(/stroke="#000"/gi,                             `stroke="${color}"`)
    .replace(/stroke="black"/gi,                            `stroke="${color}"`)
}

/**
 * Resolve the final "ink" color for a layer: manual override wins, otherwise
 * the color sampled from the raster during vectorization, otherwise black.
 */
export function resolveLayerColor(layer) {
  return layer?.colorOverride || layer?.color || '#000000'
}

/**
 * Return a single-layer SVG with its fill set to `color` (or, if omitted,
 * whatever color the layer already carries). If no recolor is needed the
 * original SVG is returned unchanged.
 */
export function buildColoredLayerSvg(layer, { color, targetSize = 1024 } = {}) {
  if (!layer?.svg) throw new Error('该图层尚未生成矢量')
  const finalColor = color || resolveLayerColor(layer)
  const { inner, viewBox } = splitSvg(layer.svg)
  const recolored = recolorSvgContent(inner, finalColor)
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${targetSize}" height="${targetSize}" viewBox="${viewBox}">`,
    `  <title>Layer ${layer.id}${layer.zh ? ' - ' + layer.zh : ''}</title>`,
    `  ${recolored}`,
    '</svg>',
  ].join('\n')
}

/**
 * Combine all 5 layers' vector SVGs into ONE grouped SVG file suitable for
 * fabrication. Each layer becomes a properly labelled <g> (Inkscape-compatible
 * layer metadata, also recognized by LightBurn / RDWorks / Illustrator), with
 * stable ids so downstream tools can isolate / hide individual layers.
 *
 * Render order: Layer 5 (background) is drawn first, Layer 1 (foreground) last
 * — matches the on-screen stacking so the flattened preview looks identical.
 *
 * Color behavior (WYSIWYG): each layer keeps its own color — either the user's
 * manual override (layer.colorOverride) or the color sampled from the raster
 * during vectorization (layer.color). Nothing is forced.
 *
 * @param {Array<{id:number, zh?:string, svg?:string, color?:string, colorOverride?:string}>} layers
 * @param {object} [opts]
 * @param {number} [opts.targetSize=1024] normalized viewBox edge length
 * @returns {string} final grouped SVG markup
 */
export function buildGroupedSvg(layers, opts = {}) {
  const normalized = (typeof opts === 'number' ? { targetSize: opts } : opts) || {}
  const { W, H } = resolveExportSize(normalized, layers)
  const usable = (layers || []).filter(l => l && typeof l.svg === 'string' && l.svg.trim())
  if (!usable.length) throw new Error('没有可导出的矢量图层')

  const ordered = [...usable].sort((a, b) => b.id - a.id)

  const groups = ordered.map((layer) => {
    const { inner: rawInner, viewBox } = splitSvg(layer.svg)
    const color = resolveLayerColor(layer)
    const needsRecolor = !!(layer.colorOverride && layer.color && layer.colorOverride.toLowerCase() !== layer.color.toLowerCase())
    const inner = needsRecolor ? recolorSvgContent(rawInner, color) : rawInner
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number)
    const sx = W / (vw || W)
    const sy = H / (vh || H)
    const tx = -vx * sx
    const ty = -vy * sy
    const needsTransform = sx !== 1 || sy !== 1 || tx !== 0 || ty !== 0
    const label = `Layer ${layer.id}${layer.zh ? ' - ' + layer.zh : ''}`
    const transformAttr = needsTransform
      ? ` transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"`
      : ''
    return [
      `  <g id="layer-${layer.id}"`,
      ` inkscape:label="${label}"`,
      ` inkscape:groupmode="layer"`,
      ` data-layer-id="${layer.id}"`,
      ` data-layer-name="${label}"`,
      ` data-layer-color="${color}"`,
      `${transformAttr}>`,
      '\n    ',
      inner,
      '\n  </g>',
    ].join('')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" version="1.1" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `  <title>Layered Sculpture (5 layers)</title>`,
    `  <desc>Generated grouped SVG for fabrication. Each &lt;g id="layer-N"&gt; is one cut layer, ordered back-to-front. Each layer preserves its own color (sampled from source or user-overridden).</desc>`,
    groups,
    '</svg>',
  ].join('\n')
}

/**
 * Escape an ID / label so it is safe to embed as an XML attribute value.
 */
function xmlAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build a single-layer SVG that packages BOTH the UV-print bitmap and the
 * laser-cut vector outline into one file. The file contains two groups:
 *
 *   <g id="print" data-role="print">  <image href="data:image/png..."/> </g>
 *   <g id="cut"   data-role="cut">    <path stroke="#ff0000" fill="none"/></g>
 *
 * Fabrication software (LightBurn, RDWorks, Roland VersaStudio, Inkscape,
 * Illustrator, etc.) can recognize the two groups and route print vs cut
 * accordingly — red hairline stroke is the de-facto "cut" convention.
 *
 * @param {object}  layer                one entry from the sculpture store
 * @param {object}  [opts]
 * @param {number}  [opts.targetSize=1024]
 * @param {string}  [opts.cutStroke='#ff0000']
 * @param {number}  [opts.cutStrokeWidth=0.5]
 * @returns {string} final SVG markup
 */
export async function buildUvCutSvg(layer, opts = {}) {
  const { cutStroke = '#ff0000', cutStrokeWidth = 0.5, aspectRatio = '1:1' } = opts
  if (!layer) throw new Error('图层为空')
  if (!layer.imageDataUrl) throw new Error('该图层没有彩色位图')

  const { W, H } = resolveExportSize(opts, [])
  const isPrintOnly = layer.id === 5
  const label = `Layer ${layer.id}${layer.zh ? ' - ' + layer.zh : ''}`
  // Subtract the canonical black frame from the bitmap so the UV print layer
  // does NOT double-burn the frame that the cut group already vectorizes as
  // <rect>. L5 (background) keeps its frame baked in because it has no cut.
  const printBitmap = isPrintOnly
    ? layer.imageDataUrl
    : await stripFrameFromBitmap(layer.imageDataUrl, aspectRatio)
  const printBlock = [
    `  <g id="print" inkscape:label="Print" inkscape:groupmode="layer" data-role="print">`,
    `    <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" xlink:href="${xmlAttr(printBitmap)}" href="${xmlAttr(printBitmap)}"/>`,
    `  </g>`,
  ].join('\n')

  if (isPrintOnly) {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `  <title>${xmlAttr(label)} — UV print only</title>`,
      `  <desc>Layer 5 is the backmost print-only layer — UV bitmap without a cut outline.</desc>`,
      printBlock,
      '</svg>',
    ].join('\n')
  }

  const cutColor = layer.colorOverride || cutStroke
  const { inner: cutInner, viewBox, W: vW, H: vH } = await extractCutPathInner(
    layer.imageDataUrl,
    { cutColor, strokeWidth: cutStrokeWidth },
  )
  const [vx, vy, vw, vh] = (viewBox || `0 0 ${vW} ${vH}`).split(/\s+/).map(Number)
  const sx = W / (vw || W)
  const sy = H / (vh || H)
  const tx = -vx * sx
  const ty = -vy * sy
  const needsTransform = sx !== 1 || sy !== 1 || tx !== 0 || ty !== 0
  const transformAttr = needsTransform
    ? ` transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"`
    : ''

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `  <title>${xmlAttr(label)} — UV print + Cut</title>`,
    `  <desc>Two layers: "print" is the UV-print bitmap, "cut" is the laser-cut outline freshly traced from the bitmap (${cutColor} hairline stroke).</desc>`,
    printBlock,
    `  <g id="cut" inkscape:label="Cut" inkscape:groupmode="layer" data-role="cut"${transformAttr}>`,
    `    ${cutInner}`,
    `  </g>`,
    '</svg>',
  ].join('\n')
}

/**
 * Same idea as `buildGroupedSvg` but each of the 5 layers contains BOTH
 * a <g id="layer-N-print"> with the UV bitmap and a <g id="layer-N-cut">
 * with the laser-cut path. Rendered back-to-front (L5 first, L1 last).
 */
export async function buildUvCutGroupedSvg(layers, opts = {}) {
  const { cutStroke = '#ff0000', cutStrokeWidth = 0.5, aspectRatio = '1:1' } = opts
  // Need a bitmap for every layer; cut paths are extracted fresh from each
  // bitmap below — no dependency on cached `layer.svg`.
  const usable = (layers || []).filter(l => l && l.imageDataUrl)
  if (!usable.length) throw new Error('没有可导出的彩色位图图层')

  const { W, H } = resolveExportSize(opts, usable)

  const ordered = [...usable].sort((a, b) => b.id - a.id)

  const blocks = await Promise.all(ordered.map(async (layer) => {
    const label = `Layer ${layer.id}${layer.zh ? ' - ' + layer.zh : ''}`
    // See buildUvCutSvg: strip the frame out of the print bitmap for every
    // layer that also emits a <rect> cut, so the frame is vectorized once
    // and never printed twice. L5 keeps its frame baked in.
    const printBitmap = layer.id === 5
      ? layer.imageDataUrl
      : await stripFrameFromBitmap(layer.imageDataUrl, aspectRatio)
    const printBlock = [
      `    <g id="layer-${layer.id}-print" inkscape:label="${xmlAttr(label)} · Print" inkscape:groupmode="layer" data-role="print">`,
      `      <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" xlink:href="${xmlAttr(printBitmap)}" href="${xmlAttr(printBitmap)}"/>`,
      `    </g>`,
    ].join('\n')

    if (layer.id === 5) {
      return [
        `  <g id="layer-${layer.id}" inkscape:label="${xmlAttr(label)}" inkscape:groupmode="layer" data-layer-id="${layer.id}" data-print-only="true">`,
        printBlock,
        `  </g>`,
      ].join('\n')
    }

    const cutColor = layer.colorOverride || cutStroke
    const { inner: cutInner, viewBox, W: vW, H: vH } = await extractCutPathInner(
      layer.imageDataUrl,
      { cutColor, strokeWidth: cutStrokeWidth },
    )
    const [vx, vy, vw, vh] = (viewBox || `0 0 ${vW} ${vH}`).split(/\s+/).map(Number)
    const sx = W / (vw || W)
    const sy = H / (vh || H)
    const tx = -vx * sx
    const ty = -vy * sy
    const needsTransform = sx !== 1 || sy !== 1 || tx !== 0 || ty !== 0
    const transformAttr = needsTransform
      ? ` transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"`
      : ''
    return [
      `  <g id="layer-${layer.id}" inkscape:label="${xmlAttr(label)}" inkscape:groupmode="layer" data-layer-id="${layer.id}">`,
      printBlock,
      `    <g id="layer-${layer.id}-cut" inkscape:label="${xmlAttr(label)} · Cut" inkscape:groupmode="layer" data-role="cut"${transformAttr}>`,
      `      ${cutInner}`,
      `    </g>`,
      `  </g>`,
    ].join('\n')
  }))
  const groups = blocks.join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `  <title>Layered Sculpture — 5 layers · UV print + Cut</title>`,
    `  <desc>Each layer-N contains a "print" group (UV bitmap). Layers 1–4 also carry a "cut" group (laser-cut outline, red hairline stroke). Layer 5 is print-only — no cut path. Ordered back-to-front.</desc>`,
    groups,
    '</svg>',
  ].join('\n')
}

export function downloadSvg(svgString, filename = 'layer.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function svgToDataUrl(svgString) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}
