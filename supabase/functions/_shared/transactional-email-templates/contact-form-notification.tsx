import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; email?: string; subject?: string; message?: string }

const ContactFormNotificationEmail = ({ name, email, subject, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Contact Form Submission</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}><Heading style={h1}>New Contact Form Submission</Heading></Section>
        <Section style={body}>
          <Section style={field}><Text style={label}>FROM</Text><Text style={value}>{name || 'Unknown'}</Text></Section>
          <Section style={field}><Text style={label}>EMAIL</Text><Text style={value}>{email || 'Unknown'}</Text></Section>
          <Section style={field}><Text style={label}>SUBJECT</Text><Text style={value}>{subject || 'No subject'}</Text></Section>
          <Section style={field}><Text style={label}>MESSAGE</Text><Text style={value}>{message || 'No message'}</Text></Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactFormNotificationEmail as React.ComponentType<Record<string, unknown>>,
  subject: (data: Record<string, unknown>) => `[Contact Form] ${data.subject || 'New submission'}`,
  displayName: 'Contact form notification (to support)',
  to: 'support@pulseos.tech',
  previewData: { name: 'Jane Doe', email: 'jane@example.com', subject: 'Question about PulseOS', message: 'I love the app!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const headerSection = { padding: '32px 40px', borderBottom: '1px solid #e2e8f0' }
const h1 = { color: '#1e293b', margin: '0', fontSize: '24px', fontWeight: '700' as const }
const body = { padding: '32px 40px' }
const field = { padding: '12px 0', borderBottom: '1px solid #e2e8f0' }
const label = { color: '#E04F3E', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase' as const, fontWeight: '600' as const, letterSpacing: '1px' }
const value = { color: '#1e293b', fontSize: '16px', margin: '0' }
