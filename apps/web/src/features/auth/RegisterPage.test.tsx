import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { RegisterPage } from './RegisterPage'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signUp: { email: vi.fn() },
  },
}))

import { authClient } from '../../lib/auth-client'

function setup() {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
  return {
    nameInput: () => screen.getByLabelText(/nimi/i),
    emailInput: () => screen.getByLabelText(/sähköposti/i),
    passwordInput: () => screen.getByLabelText(/salasana/i),
    submitButton: () => screen.getByRole('button', { name: /luo tili/i }),
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockNavigate.mockReset()
})

describe('RegisterPage', () => {
  it('calls authClient.signUp.email with name, email, and password', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({ data: {}, error: null } as never)
    const user = userEvent.setup()
    const { nameInput, emailInput, passwordInput, submitButton } = setup()

    await user.type(nameInput(), 'Matti')
    await user.type(emailInput(), 'matti@example.com')
    await user.type(passwordInput(), 'salainen123')
    await user.click(submitButton())

    await waitFor(() =>
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: 'Matti',
        email: 'matti@example.com',
        password: 'salainen123',
      })
    )
  })

  it('navigates to /settings on success', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({ data: {}, error: null } as never)
    const user = userEvent.setup()
    const { nameInput, emailInput, passwordInput, submitButton } = setup()

    await user.type(nameInput(), 'Matti')
    await user.type(emailInput(), 'matti@example.com')
    await user.type(passwordInput(), 'salainen123')
    await user.click(submitButton())

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/settings'))
  })

  it('shows an error and does not navigate when sign-up fails', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' },
    } as never)
    const user = userEvent.setup()
    const { nameInput, emailInput, passwordInput, submitButton } = setup()

    await user.type(nameInput(), 'Matti')
    await user.type(emailInput(), 'matti@example.com')
    await user.type(passwordInput(), 'salainen123')
    await user.click(submitButton())

    await waitFor(() => expect(screen.getByText(/rekisteröinti epäonnistui/i)).toBeInTheDocument())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
