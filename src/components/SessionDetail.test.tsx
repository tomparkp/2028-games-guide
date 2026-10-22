import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionDetail, type SessionDetailStatus } from '@/components/SessionDetail'

function renderDetail(status: SessionDetailStatus) {
  const onClose = vi.fn()
  render(<SessionDetail open session={null} insights={null} status={status} onClose={onClose} />)
  return { onClose }
}

describe('SessionDetail', () => {
  it('shows a loading state while the session is loading', () => {
    renderDetail('loading')

    expect(screen.getByText('Loading analysis...')).toBeTruthy()
  })

  it('shows a not-found message instead of loading forever for an unknown session', () => {
    const { onClose } = renderDetail('not-found')

    expect(screen.getByRole('heading', { name: 'Session not found' })).toBeTruthy()
    expect(screen.queryByText('Loading analysis...')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows an error message when the session fails to load', () => {
    renderDetail('error')

    expect(screen.getByRole('heading', { name: "Couldn't load this session" })).toBeTruthy()
    expect(screen.queryByText('Loading analysis...')).toBeNull()
  })
})
