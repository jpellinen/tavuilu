import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { RegisterPrompt } from './RegisterPrompt'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  mockNavigate.mockReset()
})

function setup() {
  const onDismiss = vi.fn()
  render(
    <MemoryRouter>
      <RegisterPrompt onDismiss={onDismiss} />
    </MemoryRouter>
  )
  return { onDismiss }
}

describe('RegisterPrompt', () => {
  it('shows the cross-device messaging', () => {
    setup()
    expect(screen.getByText(/säilyy kaikilla laitteilla/i)).toBeInTheDocument()
  })

  it('navigates to the registration route when "Luo tili" is tapped', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /luo tili/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/auth/register')
  })

  it('calls onDismiss when "Ehkä myöhemmin" is tapped', async () => {
    const { onDismiss } = setup()
    await userEvent.click(screen.getByRole('button', { name: /ehkä myöhemmin/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
