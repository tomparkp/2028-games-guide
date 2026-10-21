import { createServerFn } from '@tanstack/react-start'

const MAX_MESSAGE_LENGTH = 5000
const MAX_EMAIL_LENGTH = 320
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ReportIssueInput {
  email: string
  message: string
  sessionId?: string
  sessionName?: string
  pageUrl?: string
}

function normalizeString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

// For fields that end up in email headers (the subject) or one-per-line metadata: collapses
// line breaks so a crafted value can't add header lines or fake metadata rows.
function normalizeLine(value: unknown, max: number): string {
  return normalizeString(typeof value === 'string' ? value.replace(/\s+/g, ' ') : value, max)
}

function normalizeInput(input: unknown): ReportIssueInput {
  const value = (input ?? {}) as Record<string, unknown>
  const email = normalizeString(value.email, MAX_EMAIL_LENGTH)
  const message = normalizeString(value.message, MAX_MESSAGE_LENGTH)

  if (!message) {
    throw new Error('A message is required.')
  }
  if (email && !EMAIL_REGEX.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  return {
    email,
    message,
    sessionId: normalizeLine(value.sessionId, 200),
    sessionName: normalizeLine(value.sessionName, 300),
    pageUrl: normalizeLine(value.pageUrl, 500),
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Shown to the reporter for any server-side failure; the details only go to the server log.
const SEND_FAILED_MESSAGE = "Couldn't send your report. Please try again later."

export const reportIssue = createServerFn({ method: 'POST' })
  .validator(normalizeInput)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error('Report issue: RESEND_API_KEY is not set')
      throw new Error(SEND_FAILED_MESSAGE)
    }

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const replyFrom = data.email || 'anonymous'
    const subject = data.sessionName
      ? `[28Games] Issue: ${data.sessionName}`
      : '[28Games] Issue report'

    const metaLines: string[] = []
    if (data.sessionName) metaLines.push(`Session: ${data.sessionName}`)
    if (data.sessionId) metaLines.push(`Session ID: ${data.sessionId}`)
    if (data.pageUrl) metaLines.push(`URL: ${data.pageUrl}`)
    metaLines.push(`Reporter: ${replyFrom}`)

    const html = `
      <div style="font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.5;">
        <p style="color:#555;">${metaLines.map(escapeHtml).join('<br/>')}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
        <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(data.message)}</pre>
      </div>
    `

    const { error } = await resend.emails.send({
      from: '28Games Issue Report <reports@tompiarulli.com>',
      to: ['28games@tompiarulli.com'],
      replyTo: data.email || undefined,
      subject,
      html,
      text: `${metaLines.join('\n')}\n\n${data.message}`,
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Report issue: Resend send failed:', error.name, error.message)
      throw new Error(SEND_FAILED_MESSAGE)
    }

    return { ok: true as const }
  })
