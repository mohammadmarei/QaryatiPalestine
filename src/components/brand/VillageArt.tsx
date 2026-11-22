import { useId, useMemo, type ReactElement } from 'react'
import type { SceneKind } from '@/types'
import { hashString, mulberry32 } from '@/utils/misc'
import { cn } from '@/utils/cn'

/*
 * Procedural landscape illustrations.
 *
 * Each village is drawn as a small composition of Palestinian hill-country
 * motifs: terraces, olive trees, limestone houses with domes and arched
 * windows, ruins and valley gardens. The output is deterministic per seed,
 * so a village always looks the same and no two villages look identical.
 * Swap for real photography by passing `photoUrl` to the consuming card.
 */

interface Palette {
  skyTop: string
  skyBottom: string
  sun: string
  far: string
  mid: string
  near: string
  terraceLine: string
  house: string
  houseShade: string
  dome: string
  window: string
  tree: string
  treeLight: string
  trunk: string
  field: string
  fieldAlt: string
}

const palettes: Palette[] = [
  // 0 — golden morning over the Jerusalem hills
  { skyTop: '#efe2c6', skyBottom: '#f6efe0', sun: '#f7e4b8', far: '#cdbf9f', mid: '#a3ab86', near: '#6f7f55', terraceLine: '#e4d6b8', house: '#f1e8d6', houseShade: '#d4c2a0', dome: '#e2d3b4', window: '#5b4a3a', tree: '#5c7350', treeLight: '#8c9c74', trunk: '#6b5a45', field: '#b7b27a', fieldAlt: '#93a06c' },
  // 1 — warm afternoon, olive and limestone
  { skyTop: '#e7d6b8', skyBottom: '#f3e8d4', sun: '#f3d59c', far: '#bcad8d', mid: '#8d9b72', near: '#58704a', terraceLine: '#dccaa6', house: '#efe3cb', houseShade: '#cdb690', dome: '#dfcba6', window: '#4f3f31', tree: '#4f6a45', treeLight: '#86996c', trunk: '#64523e', field: '#c2ab6c', fieldAlt: '#8f9c63' },
  // 2 — dusk, accent light
  { skyTop: '#d9a98a', skyBottom: '#efd6bd', sun: '#f6dcc0', far: '#a98a78', mid: '#7f6f5a', near: '#4b5340', terraceLine: '#c9ab92', house: '#ecd9c2', houseShade: '#c39f84', dome: '#d9bda2', window: '#3f2f27', tree: '#4a5a3e', treeLight: '#7b8664', trunk: '#5a4636', field: '#b48f63', fieldAlt: '#7f7c52' },
  // 3 — cool, clear morning
  { skyTop: '#d6dfd6', skyBottom: '#f1ebdc', sun: '#fbf3e1', far: '#b2bca8', mid: '#869875', near: '#4d6a45', terraceLine: '#d9d3bf', house: '#f3ecdc', houseShade: '#d0c4a8', dome: '#e4dac4', window: '#4a4036', tree: '#4d6a45', treeLight: '#86a07a', trunk: '#62523f', field: '#a9b37f', fieldAlt: '#7f9a68' },
  // 4 — harvest wheat
  { skyTop: '#ecdcb8', skyBottom: '#f7eedc', sun: '#f8e2a8', far: '#cfb787', mid: '#ad9a62', near: '#727548', terraceLine: '#e1cc9c', house: '#f2e6cf', houseShade: '#d3bd92', dome: '#e3d0a8', window: '#544332', tree: '#5d6d44', treeLight: '#929b68', trunk: '#6a5640', field: '#d1b16b', fieldAlt: '#a9a35d' },
  // 5 — evening green
  { skyTop: '#c9cfb9', skyBottom: '#ebdfc3', sun: '#f5e7c4', far: '#8fa088', mid: '#61795a', near: '#2f4330', terraceLine: '#b8bfa2', house: '#eee5d1', houseShade: '#c5b597', dome: '#d9ccb0', window: '#3a332b', tree: '#3d5639', treeLight: '#6f8a62', trunk: '#4e4232', field: '#9ea775', fieldAlt: '#6f8a5c' },
]

type Pt = [number, number]
const W = 800
const H = 500

function ridge(rand: () => number, baseY: number, amp: number, step = 14): Pt[] {
  const p1 = rand() * 6.28
  const p2 = rand() * 6.28
  const f1 = 0.0035 + rand() * 0.003
  const f2 = 0.01 + rand() * 0.008
  const pts: Pt[] = []
  for (let x = -20; x <= W + 20; x += step) {
    pts.push([x, baseY + amp * (Math.sin(x * f1 + p1) * 0.7 + Math.sin(x * f2 + p2) * 0.3)])
  }
  return pts
}

function bump(rand: () => number, baseY: number, peak: number, cx: number, spread: number, step = 12): Pt[] {
  const p = rand() * 6.28
  const pts: Pt[] = []
  for (let x = -20; x <= W + 20; x += step) {
    const g = Math.exp(-(((x - cx) / spread) ** 2))
    pts.push([x, baseY - peak * g + 6 * Math.sin(x * 0.02 + p)])
  }
  return pts
}

const area = (pts: Pt[], bottom = H) =>
  `M${pts[0][0]},${bottom} ` + pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0]},${bottom} Z`

const line = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')

const shift = (pts: Pt[], dy: number, squeeze = 1): Pt[] => pts.map(([x, y]) => [x, y * squeeze + dy])

function yAt(pts: Pt[], x: number) {
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x0, y0] = pts[i - 1]
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
  }
  return pts[pts.length - 1][1]
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shiftBits: number) => {
    const ca = (pa >> shiftBits) & 255
    const cb = (pb >> shiftBits) & 255
    return Math.round(ca + (cb - ca) * t)
  }
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`
}

function olive(key: string, x: number, y: number, s: number, p: Palette, rand: () => number): ReactElement {
  const lean = (rand() - 0.5) * 6 * s
  const blobs = Array.from({ length: 6 }, () => ({
    dx: (rand() - 0.5) * 22 * s,
    dy: (rand() - 0.5) * 10 * s,
    r: (7 + rand() * 5) * s,
  }))
  return (
    <g key={key}>
      <path
        d={`M${x - 2.4 * s},${y} Q${x - 1 * s},${y - 9 * s} ${x - 3 * s + lean},${y - 17 * s} L${x + 1.2 * s + lean},${y - 17 * s} Q${x + 1.4 * s},${y - 8 * s} ${x + 3 * s},${y} Z`}
        fill={p.trunk}
      />
      {blobs.map((bl, i) => (
        <circle key={i} cx={x + lean + bl.dx} cy={y - 24 * s + bl.dy} r={bl.r} fill={p.tree} />
      ))}
      {blobs.slice(0, 3).map((bl, i) => (
        <circle key={`h${i}`} cx={x + lean + bl.dx - 2 * s} cy={y - 27 * s + bl.dy} r={bl.r * 0.55} fill={p.treeLight} opacity={0.75} />
      ))}
    </g>
  )
}

function cypress(key: string, x: number, y: number, s: number, p: Palette): ReactElement {
  return (
    <g key={key}>
      <ellipse cx={x} cy={y - 22 * s} rx={5 * s} ry={24 * s} fill={mix(p.tree, '#1d2a1c', 0.35)} />
      <ellipse cx={x - 1.5 * s} cy={y - 26 * s} rx={2 * s} ry={14 * s} fill={p.treeLight} opacity={0.35} />
    </g>
  )
}

function palm(key: string, x: number, y: number, s: number, p: Palette): ReactElement {
  const top: Pt = [x + 6 * s, y - 52 * s]
  const fronds = [-150, -115, -70, -35, -5, 20].map((deg) => {
    const r = (deg * Math.PI) / 180
    const ex = top[0] + Math.cos(r) * 22 * s
    const ey = top[1] + Math.sin(r) * 14 * s + 10 * s
    return `M${top[0]},${top[1]} Q${(top[0] + ex) / 2},${top[1] - 8 * s} ${ex},${ey}`
  })
  return (
    <g key={key}>
      <path d={`M${x},${y} Q${x + 2 * s},${y - 30 * s} ${top[0]},${top[1]}`} stroke={p.trunk} strokeWidth={3 * s} fill="none" strokeLinecap="round" />
      {fronds.map((d, i) => (
        <path key={i} d={d} stroke={p.tree} strokeWidth={3.2 * s} fill="none" strokeLinecap="round" />
      ))}
    </g>
  )
}

function house(key: string, x: number, y: number, s: number, p: Palette, rand: () => number): ReactElement {
  const w = (20 + rand() * 18) * s
  const h = (15 + rand() * 14) * s
  const side = w * 0.24
  const top = y - h
  const hasDome = rand() < 0.35
  const windows = rand() < 0.5 ? 1 : 2
  const winW = 4.2 * s
  const winH = 7 * s
  return (
    <g key={key}>
      <path d={`M${x + w},${y} L${x + w + side},${y - 3 * s} L${x + w + side},${top - 3 * s} L${x + w},${top} Z`} fill={p.houseShade} />
      <rect x={x} y={top} width={w} height={h} fill={p.house} />
      <rect x={x - 0.6 * s} y={top - 2 * s} width={w + 1.2 * s} height={2.2 * s} fill={p.houseShade} opacity={0.75} />
      {hasDome && (
        <path d={`M${x + w * 0.22},${top - 1.5 * s} A${w * 0.28},${w * 0.24} 0 0 1 ${x + w * 0.78},${top - 1.5 * s} Z`} fill={p.dome} />
      )}
      {Array.from({ length: windows }, (_, i) => {
        const wx = x + (w / (windows + 1)) * (i + 1) - winW / 2
        const wy = top + h * 0.3
        return (
          <path
            key={i}
            d={`M${wx},${wy + winH} L${wx},${wy + winW / 2} A${winW / 2},${winW / 2} 0 0 1 ${wx + winW},${wy + winW / 2} L${wx + winW},${wy + winH} Z`}
            fill={p.window}
            opacity={0.72}
          />
        )
      })}
    </g>
  )
}

function minaret(key: string, x: number, y: number, s: number, p: Palette): ReactElement {
  return (
    <g key={key}>
      <rect x={x} y={y - 58 * s} width={7 * s} height={58 * s} fill={p.house} />
      <rect x={x + 7 * s} y={y - 58 * s} width={1.8 * s} height={58 * s} fill={p.houseShade} />
      <rect x={x - 2 * s} y={y - 44 * s} width={11 * s} height={2.5 * s} fill={p.houseShade} />
      <path d={`M${x - 0.5 * s},${y - 58 * s} L${x + 3.5 * s},${y - 70 * s} L${x + 7.5 * s},${y - 58 * s} Z`} fill={p.dome} />
    </g>
  )
}

function cluster(rand: () => number, pts: Pt[], x0: number, x1: number, count: number, s: number, p: Palette, sink = 4) {
  const items = Array.from({ length: count }, () => {
    const x = x0 + rand() * (x1 - x0)
    const y = yAt(pts, x) + sink * s + rand() * 18 * s
    return { x, y }
  }).sort((a, b) => a.y - b.y)
  return items.map((it, i) => house(`h${x0}-${i}`, it.x, it.y, s * (0.85 + rand() * 0.3), p, rand))
}

function column(key: string, x: number, y: number, h: number, s: number, p: Palette): ReactElement {
  return (
    <g key={key}>
      <rect x={x - 4 * s} y={y - h} width={8 * s} height={h} fill={p.house} />
      <rect x={x + 2 * s} y={y - h} width={2 * s} height={h} fill={p.houseShade} opacity={0.8} />
      <rect x={x - 6 * s} y={y - h - 3 * s} width={12 * s} height={3 * s} fill={p.houseShade} />
      <rect x={x - 6 * s} y={y - 3 * s} width={12 * s} height={3 * s} fill={p.houseShade} />
    </g>
  )
}

function compose(scene: SceneKind, p: Palette, rand: () => number, detail: number): ReactElement[] {
  const els: ReactElement[] = []
  const far = ridge(rand, 215, 26)
  els.push(<path key="far" d={area(far)} fill={p.far} opacity={0.75} />)
  // Haze band between distance layers
  els.push(<rect key="haze" x={0} y={200} width={W} height={120} fill={p.skyBottom} opacity={0.25} />)

  if (scene === 'terraces') {
    const mid = ridge(rand, 250, 42)
    const bands = 9
    for (let k = 0; k < bands; k++) {
      const pts = shift(mid, k * 28 + k * k * 1.4)
      const t = k / bands
      els.push(<path key={`tb${k}`} d={area(pts)} fill={mix(p.mid, p.near, t)} />)
      els.push(<path key={`tl${k}`} d={line(pts)} stroke={p.terraceLine} strokeWidth={1.6 + t * 2.2} strokeDasharray={`${5 + t * 6} ${2 + t * 2}`} fill="none" opacity={0.85} />)
      const trees = Math.round((3 + rand() * 3) * detail)
      for (let i = 0; i < trees; i++) {
        const x = rand() * W
        if (k < 2 && x > 430 && x < 760) continue
        els.push(olive(`to${k}-${i}`, x, yAt(pts, x) + 22 + k * 1.5, 0.45 + t * 0.95, p, rand))
      }
    }
    els.splice(3, 0, ...cluster(rand, mid, 450, 740, Math.round(9 * detail), 0.85, p))
  } else if (scene === 'grove') {
    const mid = ridge(rand, 300, 18)
    els.push(<path key="mid" d={area(mid)} fill={p.mid} />)
    els.push(...cluster(rand, far, 520, 700, Math.round(6 * detail), 0.5, p))
    const ground = ridge(rand, 360, 12)
    els.push(<path key="ground" d={area(ground)} fill={p.near} />)
    const rows = [
      { y: 330, s: 0.45, n: 14 },
      { y: 372, s: 0.75, n: 10 },
      { y: 430, s: 1.15, n: 7 },
      { y: 505, s: 1.75, n: 5 },
    ]
    rows.forEach((r, ri) => {
      const n = Math.round(r.n * detail)
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.5) / n) * W + (rand() - 0.5) * 40
        els.push(olive(`go${ri}-${i}`, x, r.y + rand() * 8, r.s, p, rand))
      }
    })
  } else if (scene === 'ruins') {
    const mid = bump(rand, 330, 70, 380 + rand() * 80, 260)
    els.push(<path key="mid" d={area(mid)} fill={p.mid} />)
    const cx = 260 + rand() * 60
    const baseY = yAt(mid, cx + 140) + 6
    els.push(<rect key="podium" x={cx - 20} y={baseY - 2} width={330} height={8} fill={p.houseShade} opacity={0.9} />)
    for (let i = 0; i < 9; i++) {
      const broken = rand() < 0.35
      els.push(column(`col${i}`, cx + i * 36, baseY, broken ? 30 + rand() * 25 : 72, 1, p))
    }
    els.push(...cluster(rand, mid, 600, 760, Math.round(6 * detail), 0.75, p, 18))
    const near = ridge(rand, 420, 16)
    els.push(<path key="near" d={area(near)} fill={p.near} />)
    for (let i = 0; i < Math.round(7 * detail); i++) {
      const x = rand() * W
      els.push(rand() < 0.3 ? cypress(`rc${i}`, x, yAt(near, x) + 10, 1, p) : olive(`ro${i}`, x, yAt(near, x) + 14, 1 + rand() * 0.5, p, rand))
    }
  } else if (scene === 'hilltop') {
    const cx = 330 + rand() * 140
    const mid = bump(rand, 420, 200, cx, 210)
    els.push(<path key="mid" d={area(mid)} fill={mix(p.mid, p.near, 0.3)} />)
    for (let k = 1; k < 6; k++) {
      els.push(<path key={`hl${k}`} d={line(shift(mid, k * 30))} stroke={p.terraceLine} strokeWidth={1.4} strokeDasharray="5 3" fill="none" opacity={0.55} />)
    }
    const peakY = yAt(mid, cx)
    els.push(minaret('min', cx + 18, peakY + 14, 1, p))
    els.push(...cluster(rand, mid, cx - 120, cx + 110, Math.round(16 * detail), 0.9, p, 6))
    for (let i = 0; i < Math.round(10 * detail); i++) {
      const x = rand() * W
      const y = yAt(mid, x)
      if (Math.abs(x - cx) < 120) continue
      els.push(olive(`ho${i}`, x, y + 30 + rand() * 40, 0.7 + rand() * 0.4, p, rand))
    }
  } else if (scene === 'valley') {
    const left: Pt[] = []
    const right: Pt[] = []
    const vx = 380 + rand() * 80
    for (let x = -20; x <= W + 20; x += 12) {
      left.push([x, 230 + Math.max(0, x - 40) * 0.55 + 6 * Math.sin(x * 0.03)])
      right.push([x, 250 + Math.max(0, W - x - 60) * 0.5 + 6 * Math.sin(x * 0.025)])
    }
    els.push(<path key="right" d={area(right)} fill={p.mid} />)
    for (let k = 1; k < 5; k++) els.push(<path key={`rl${k}`} d={line(shift(right, k * 26))} stroke={p.terraceLine} strokeWidth={1.4} strokeDasharray="5 3" fill="none" opacity={0.5} />)
    els.push(<path key="left" d={area(left)} fill={mix(p.mid, p.near, 0.25)} />)
    els.push(...cluster(rand, left, 20, vx - 140, Math.round(14 * detail), 0.95, p, 6))
    // Valley floor gardens
    const floorY = 440
    els.push(<path key="floor" d={`M0,${floorY} Q${vx},${floorY - 30} ${W},${floorY} L${W},${H} L0,${H} Z`} fill={p.near} />)
    for (let i = 0; i < 7; i++) {
      els.push(<rect key={`g${i}`} x={60 + i * 100 + rand() * 20} y={floorY + 4 + rand() * 10} width={70} height={10} rx={3} fill={i % 2 ? p.fieldAlt : p.field} opacity={0.75} />)
    }
    els.push(<ellipse key="pool" cx={vx} cy={floorY - 4} rx={36} ry={7} fill="#9fb7b1" opacity={0.85} />)
    for (let i = 0; i < Math.round(9 * detail); i++) {
      const x = vx + 60 + rand() * (W - vx - 60)
      els.push(olive(`vo${i}`, x, yAt(right, x) + 30 + rand() * 30, 0.7 + rand() * 0.5, p, rand))
    }
  } else {
    // plain
    const horizon = 300
    els.push(<path key="plainbg" d={`M0,${horizon} L${W},${horizon} L${W},${H} L0,${H} Z`} fill={p.mid} />)
    els.push(...cluster(rand, Array.from({ length: 60 }, (_, i): Pt => [i * 14 - 20, horizon]), 80, 420, Math.round(10 * detail), 0.55, p, 0))
    const stripes = 7
    for (let i = 0; i < stripes; i++) {
      const y0 = horizon + 8 + i * i * 4.2
      const y1 = horizon + 8 + (i + 1) * (i + 1) * 4.2
      els.push(<path key={`f${i}`} d={`M0,${y0} L${W},${y0 - 6} L${W},${y1 - 6} L0,${y1} Z`} fill={i % 2 ? p.field : p.fieldAlt} opacity={0.9} />)
    }
    for (let i = 0; i < Math.round(6 * detail); i++) {
      const x = 40 + rand() * (W - 80)
      const y = 380 + rand() * 110
      els.push(rand() < 0.4 ? palm(`pp${i}`, x, y, 0.6 + (y - 380) / 140, p) : olive(`po${i}`, x, y, 0.6 + (y - 380) / 120, p, rand))
    }
  }
  return els
}

export interface VillageArtProps {
  seed: string
  scene: SceneKind
  palette?: number
  className?: string
  /** Higher detail for hero placements. */
  detail?: number
  label?: string
}

export function VillageArt({ seed, scene, palette = 0, className, detail = 1, label }: VillageArtProps) {
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const p = palettes[palette % palettes.length]
  const elements = useMemo(() => compose(scene, p, mulberry32(hashString(seed)), detail), [scene, p, seed, detail])
  const sunX = useMemo(() => 120 + (hashString(seed + 'sun') % 560), [seed])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor={p.sun} stopOpacity="1" />
          <stop offset="0.45" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#1b2a20" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <circle cx={sunX} cy={110} r={110} fill={`url(#${id}-sun)`} />
      <circle cx={sunX} cy={110} r={26} fill={p.sun} opacity={0.9} />
      {elements}
      <rect width={W} height={H} fill={`url(#${id}-shade)`} />
    </svg>
  )
}
