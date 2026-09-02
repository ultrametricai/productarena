// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import InstallCommands from '@/components/InstallCommands'
import type { Product } from '@/lib/schemas'

const baseProduct: Product = {
  id: 'p', name: 'P', vendor: 'V', type: 'oss', urls: { site: 'https://p.example' },
}

describe('InstallCommands', () => {
  it('renders nothing when there is no install array', () => {
    const { container } = render(<InstallCommands product={baseProduct} />)
    expect(container.textContent).toBe('')
  })

  it('renders nothing for an empty install array', () => {
    const { container } = render(<InstallCommands product={{ ...baseProduct, install: [] }} />)
    expect(container.textContent).toBe('')
  })

  it('renders a label chip and the exact command', () => {
    render(
      <InstallCommands
        product={{ ...baseProduct, install: [{ label: 'npm', command: 'npm i react react-dom', url: 'https://react.dev/learn/installation' }] }}
      />,
    )
    expect(screen.getByText('npm')).toBeDefined()
    expect(screen.getByText('npm i react react-dom')).toBeDefined()
  })

  it('renders one row per install entry', () => {
    render(
      <InstallCommands
        product={{
          ...baseProduct,
          install: [
            { label: 'npm', command: 'npm i solid-js' },
            { label: 'pip', command: 'pip install vllm' },
          ],
        }}
      />,
    )
    expect(screen.getByText('npm i solid-js')).toBeDefined()
    expect(screen.getByText('pip install vllm')).toBeDefined()
  })

  it('shows a shell-piping caution caption only for curl|sh style commands', () => {
    render(
      <InstallCommands
        product={{
          ...baseProduct,
          install: [
            { label: 'npm', command: 'npm i -g vercel' },
            { label: 'installer', command: 'curl -fsSL https://ollama.com/install.sh | sh' },
          ],
        }}
      />,
    )
    expect(screen.getAllByText(/review any script before piping it to a shell/i)).toHaveLength(1)
  })

  it('copies the command to the clipboard and shows confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<InstallCommands product={{ ...baseProduct, install: [{ label: 'npm', command: 'npm i react react-dom' }] }} />)
    fireEvent.click(screen.getByRole('button', { name: /copy npm command/i }))

    expect(writeText).toHaveBeenCalledWith('npm i react react-dom')
    expect(await screen.findByTitle('Copied')).toBeDefined()
  })
})
