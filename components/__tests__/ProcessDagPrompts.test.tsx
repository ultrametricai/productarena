// @vitest-environment jsdom
// The per-step agent-prompt affordances are GONE from the process-page render path (founder
// 2026-10-02): no 'prompt' copy box, no '🪄 do it with AI' row, no Open-in-Claude/ChatGPT
// links. The committed data (data/step-prompts.json, lib/stepPrompts.ts, the pipeline
// generator) stays — this pin renders a real task WITH committed prompts and proves the DAG
// no longer mounts them, while the manual 'do it yourself' affordance survives.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProcessDag from '@/components/ProcessDag'
import { loadProcesses } from '@/lib/processes'
import { loadStepPrompts } from '@/lib/stepPrompts'

const TASK_ID = 'growth_005' // Set up transactional email — the original step-prompts pilot.

const mount = () => {
  const task = loadProcesses().find((t) => t.id === TASK_ID)!
  const div = document.createElement('div')
  div.innerHTML = renderToString(
    <ProcessDag nodes={task.dag.nodes} edges={task.dag.edges} taskId={task.id} lensKey={task.id} />,
  )
  return div
}

describe('ProcessDag — step prompts removed from the render path (founder 2026-10-02)', () => {
  it('the committed prompt data still exists for the pilot task (data untouched)', () => {
    expect(loadStepPrompts().filter((p) => p.taskId === TASK_ID).length).toBeGreaterThan(0)
  })

  it('renders no prompt box, no 🪄 do-it-with-AI row, and no Open-in-Claude/ChatGPT links', () => {
    const el = mount()
    const text = el.textContent ?? ''
    expect(text).not.toContain('🪄')
    expect(text.toLowerCase()).not.toContain('do it with ai')
    // 'ChatGPT' may still appear as a judged VENDOR chip — what must be gone are the
    // open-in-assistant links and the copyable prompt box itself.
    expect(text).not.toContain('Open in Claude')
    expect(text).not.toContain('Open in ChatGPT')
    expect(el.querySelector('[data-step-prompt]')).toBeNull()
    for (const a of el.querySelectorAll('a')) {
      expect(a.getAttribute('href')).not.toMatch(/claude\.ai|chat\.openai\.com|chatgpt\.com/)
    }
  })

  it('keeps the manual do-it-yourself affordance on actionUrl steps', () => {
    // An actionUrl step elsewhere in the corpus still renders its external manual link.
    const task = loadProcesses().find((t) => t.dag.nodes.some((n) => n.actionUrl))!
    const div = document.createElement('div')
    div.innerHTML = renderToString(
      <ProcessDag nodes={task.dag.nodes} edges={task.dag.edges} taskId={task.id} lensKey={task.id} />,
    )
    expect(div.textContent).toContain('do it yourself:')
  })
})
