'use client'

// The landing homepage's WebGL Newton-fractal hero backdrop, restored (founder 2026-09-29:
// "the homepage has lost its animations"). Faithful port of the original compiled script —
// recovered from the web.archive.org 2026-08-25 snapshot of ultrametric.ai (inline module
// script, originally src/lib/newton-backdrop.ts on the Astro landing). The GLSL below is the
// original shader source verbatim; the root choreography (per-root angular speeds/phases,
// radial pulse, pointer parallax on root 0) matches the compiled constants.
//
// Behavior, as the original:
// - Draws one static frame immediately (t=40s), then fades the canvas in (drops opacity-0).
// - prefers-reduced-motion: that single static frame only — no animation, no listeners.
// - No WebGL / shader failure: bails silently; the page's .cb-fallback gradient stays.
// - On webglcontextlost: stops and fades the canvas back out to the gradient.
// Improvement over the original loop: rAF is fully cancelled (not just skipped) while the
// document is hidden or the hero is off-viewport, and restarts on return.

import { useEffect, useRef } from 'react'

const ROOT_COUNT = 5

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_roots[${ROOT_COUNT}];

const int ITER = 30;
const float TAU = 6.28318530718;

vec2 cdiv(vec2 a, vec2 b) { return vec2(dot(a, b), a.y * b.x - a.x * b.y) / (dot(b, b) + 1e-9); }
vec3 pal(float t) { return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67))); }

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  vec2 z = uv * 1.55;

  // acc counts "settled" iterations: converged pixels add ~1 per step,
  // boundary pixels keep taking large steps and add little — so
  // 1 - acc/ITER is a smooth measure of how hard the pixel fought.
  float acc = 0.0;
  for (int i = 0; i < ITER; i++) {
    vec2 s = vec2(0.0);
    for (int k = 0; k < ${ROOT_COUNT}; k++) { s += cdiv(vec2(1.0, 0.0), z - u_roots[k]); }
    vec2 st = cdiv(vec2(1.0, 0.0), s);
    z -= st;
    acc += exp(-4.0 * length(st));
  }

  float best = 1e9;
  float idx = 0.0;
  for (int k = 0; k < ${ROOT_COUNT}; k++) {
    float d = distance(z, u_roots[k]);
    if (d < best) { best = d; idx = float(k); }
  }

  float edge = pow(clamp(1.0 - acc / float(ITER), 0.0, 1.0), 1.2);
  vec3 hue = pal(idx * 0.2 + u_time * 0.01);
  vec3 col = hue * (0.05 + 1.35 * edge);
  col += vec3(1.0) * pow(edge, 4.0) * 0.8;
  col += hue * 0.06 * (0.5 + 0.5 * sin(TAU * fract(acc * 0.33)));

  float vig = smoothstep(2.1, 0.4, length(uv));
  col *= 0.45 + 0.55 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`

// Per-root angular drift speeds and radial-pulse phases (original compiled constants).
const ROOT_SPEED = [0.11, -0.13, 0.09, -0.07, 0.12]
const ROOT_PHASE = [0.5, 1.3, 2.1, 3.4, 4.2]

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeroFractalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Defer the WebGL bring-up (context + synchronous shader compile/link + first full-screen
    // draw) behind an idle callback (mobile-nav perf fix 2026-10-01): this component mounts in
    // the arrival frame of a navigation to the homepage, and on a low-power mobile GPU the
    // compile/link work blocked the main thread exactly when the new page should paint. The
    // static .cb-fallback gradient (already the SSG/no-WebGL state) covers the gap; nothing is
    // removed — the fractal still fades in, just off the critical path.
    let cancelled = false
    let cleanup: (() => void) | undefined
    const start = () => {
      if (cancelled) return
      cleanup = initFractal(canvas)
    }
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(start, { timeout: 1500 })
    } else {
      // Safari has no requestIdleCallback — a short timeout clears the arrival frame.
      timeoutId = setTimeout(start, 200)
    }
    return () => {
      cancelled = true
      if (idleId !== undefined && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      cleanup?.()
    }
  }, [])

  // Matches the original .cb-canvas element: absolute overlay, faded in by script only once a
  // frame has rendered — the .cb-fallback gradient underneath is what shows otherwise.
  return (
    <canvas
      ref={canvasRef}
      className="cb-canvas absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000"
      aria-hidden
    />
  )
}

// The original mount-time body, unchanged in behavior: build the GL pipeline, draw the single
// static frame, fade in, then run/pause the loop off visibility + viewport. Returns the
// listener/rAF cleanup (undefined where it bails — no WebGL, shader failure, reduced motion).
function initFractal(canvas: HTMLCanvasElement): (() => void) | undefined {
    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
    } catch {
      return
    }
    if (!gl) return
    const vert = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
    if (!vert || !frag) return
    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) return
    gl.useProgram(program)

    // One oversized triangle covering the viewport.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRoots = gl.getUniformLocation(program, 'u_roots[0]')

    const reduced = prefersReducedMotion()
    let visible = true
    let inView = true
    let raf = 0
    let lost = false
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const roots = new Float32Array(ROOT_COUNT * 2)
    const start = performance.now()

    function resize() {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w
        canvas.height = h
      }
    }

    function draw(t: number) {
      if (!gl || !canvas || lost) return
      resize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      pointer.x += (pointer.targetX - pointer.x) * 0.04
      pointer.y += (pointer.targetY - pointer.y) * 0.04
      for (let i = 0; i < ROOT_COUNT; i++) {
        const angle = (i / ROOT_COUNT) * Math.PI * 2 + t * (ROOT_SPEED[i] ?? 0)
        const radius = 1.05 + 0.22 * Math.sin(t * 0.21 + (ROOT_PHASE[i] ?? 0))
        roots[i * 2] = Math.cos(angle) * radius + (i === 0 ? pointer.x * 0.5 : 0)
        roots[i * 2 + 1] = Math.sin(angle) * radius + (i === 0 ? pointer.y * 0.5 : 0)
      }
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
      gl.uniform2fv(uRoots, roots)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    function tick() {
      raf = requestAnimationFrame(() => {
        draw((performance.now() - start) / 1e3)
        tick()
      })
    }
    function updateRunning() {
      const shouldRun = visible && inView && !lost
      if (shouldRun && raf === 0) {
        tick()
      } else if (!shouldRun && raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    // Single static frame (original renders t=40s), then fade in.
    draw(40)
    canvas.classList.remove('opacity-0')

    if (reduced) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }
    const onVisibility = () => {
      visible = document.visibilityState === 'visible'
      updateRunning()
    }
    const onContextLost = (e: Event) => {
      e.preventDefault()
      lost = true
      updateRunning()
      canvas.classList.add('opacity-0')
    }
    window.addEventListener('pointermove', onPointerMove)
    document.addEventListener('visibilitychange', onVisibility)
    canvas.addEventListener('webglcontextlost', onContextLost)
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting)
        updateRunning()
      })
      io.observe(canvas)
    }
    updateRunning()

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf)
      raf = 0
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      io?.disconnect()
    }
}
