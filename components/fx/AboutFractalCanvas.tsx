'use client'

// The /about page's own fractal backdrop (founder 2026-10-02: "bring an interesting fractal
// unique animation to the about page") — unique to this page: the BURNING SHIP fractal,
// z → (|Re z| + i·|Im z|)² + c over the c-plane, framed on the iconic "ship" west of the main
// body and breathing with a slow zoom/pan drift. The homepage keeps its Newton fractal and
// /company its Julia set; this is the third member of the family, amber↔violet-tinted so the
// three pages read as siblings, not clones.
//
// Behavior contract mirrors JuliaHeroCanvas/HeroFractalCanvas exactly:
// - One static frame, then fade-in; prefers-reduced-motion keeps only that frame.
// - No WebGL: bails — the page renders fine without it.
// - rAF pauses on document.hidden and off-viewport (IntersectionObserver); context-loss safe.

import { useEffect, useRef } from 'react'

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

const int ITER = 110;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);

  // Slow breathing zoom around the ship at c ≈ (-1.757, -0.028) — the classic rigging region.
  float zoom = 0.62 + 0.10 * sin(u_time * 0.045);
  vec2 center = vec2(-1.757 + 0.012 * sin(u_time * 0.021), -0.028 + 0.006 * cos(u_time * 0.017));
  // The ship reads best flipped so the "masts" rise upward.
  vec2 c = center + vec2(uv.x, -uv.y) * zoom;

  vec2 z = vec2(0.0);
  float m = 0.0;
  for (int i = 0; i < ITER; i++) {
    z = vec2(abs(z.x), abs(z.y));
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 16.0) break;
    m += 1.0;
  }

  vec3 col = vec3(0.035, 0.035, 0.043); // zinc-950 base (#09090b)
  if (m < float(ITER)) {
    float sm = m + 1.0 - log2(max(1e-9, log2(dot(z, z))));
    float band = sm * 0.038 + u_time * 0.008;
    float glow = pow(clamp(sm / float(ITER), 0.0, 1.0), 1.5);
    // Amber↔violet duotone — deliberately not the homepage's emerald.
    vec3 amber = vec3(0.984, 0.749, 0.141);
    vec3 violet = vec3(0.655, 0.545, 0.98);
    vec3 hue = mix(amber, violet, 0.5 + 0.5 * sin(6.2831853 * band));
    col += hue * glow * 0.16;
    col += violet * pow(glow, 5.0) * 0.2;
  } else {
    col += vec3(0.045, 0.03, 0.055);
  }

  float vig = smoothstep(2.1, 0.3, length(uv));
  col *= 0.35 + 0.65 * vig;

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

export default function AboutFractalCanvas() {
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

    draw(12)
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
