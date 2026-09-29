'use client'

// The /company page's Julia-set WebGL hero backdrop, restored (founder 2026-09-29: "the
// homepage has lost its animations"). The original compiled chunk for this page was NOT
// recoverable (the landing origin now 404s its /_astro assets and web.archive.org has no
// /company snapshot), so this is a re-implementation in the same visual family: the landing's
// wordmark hover effect (whose compiled source WAS recovered) renders the quadratic Julia set
// z → z² + c with c = 0.7885·e^{iθ} and θ drifting slowly — this backdrop draws the same set
// full-bleed, but dark, subtle, and emerald-tinted to sit behind hero copy, with smooth
// escape-time shading (the same log-log smoothing the recovered scripts use).
//
// Behavior mirrors the restored hero fractal (components/fx/HeroFractalCanvas.tsx):
// - One static frame, then fade-in; prefers-reduced-motion keeps only that frame.
// - No WebGL: bails — the page's graph-paper grid + radial gradient fallback stays.
// - rAF pauses on document.hidden and off-viewport (IntersectionObserver).

import { useEffect, useRef } from 'react'

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

const int ITER = 96;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  vec2 z = uv * 1.5;

  // c walks slowly around the |c| = 0.7885 circle — the same Julia family as the
  // recovered wordmark effect (its compiled source used theta = t * 4e-4).
  float theta = 0.62 + 0.22 * sin(u_time * 0.05) + u_time * 0.004;
  vec2 c = 0.7885 * vec2(cos(theta), sin(theta));

  float m = 0.0;
  for (int i = 0; i < ITER; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 16.0) break;
    m += 1.0;
  }

  vec3 col = vec3(0.035, 0.035, 0.043); // zinc-950 base (#09090b)
  if (m < float(ITER)) {
    // Smooth escape-time shading (log-log smoothing, as the recovered scripts).
    float sm = m + 1.0 - log2(max(1e-9, log2(dot(z, z))));
    float band = sm * 0.045 + u_time * 0.01;
    float glow = pow(clamp(sm / float(ITER), 0.0, 1.0), 1.4);
    // Emerald-tinted, deliberately dim: filaments read as faint charted contours.
    vec3 emerald = vec3(0.204, 0.827, 0.6);
    vec3 zinc = vec3(0.63, 0.63, 0.67);
    vec3 hue = mix(emerald, zinc, 0.5 + 0.5 * sin(6.2831853 * band));
    col += hue * glow * 0.22;
    col += emerald * pow(glow, 5.0) * 0.25;
  } else {
    // Interior of the set: barely lifted from the base so the shape stays legible.
    col += vec3(0.02, 0.05, 0.04);
  }

  float vig = smoothstep(2.0, 0.35, length(uv));
  col *= 0.4 + 0.6 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`

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

export default function JuliaHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = true
    let inView = true
    let raf = 0
    let lost = false
    const start = performance.now()

    function draw(t: number) {
      if (!gl || !canvas || lost) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
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
      if (shouldRun && raf === 0) tick()
      else if (!shouldRun && raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    draw(40)
    canvas.classList.remove('opacity-0')

    if (reduced) return

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
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      io?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000"
      aria-hidden
    />
  )
}
