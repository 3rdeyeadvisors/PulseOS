import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string }

const ContactFormConfirmationEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message - PulseOS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>✉️ Message Received!</Heading></Section>
        <Section style={body}>
          <Text style={text}>Hi {name || 'there'}!</Text>
          <Text style={text}>Thank you for reaching out to us. We've received your message and will get back to you as soon as possible, typically within 24-48 hours.</Text>
          <Text style={footerNote}>Best regards, The PulseOS Team</Text>
        </Section>
        <Section style={footer}><Text style={footerText}>This is an automated confirmation. Please do not reply to this email.</Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactFormConfirmationEmail,
  subject: 'We received your message - PulseOS',
  displayName: 'Contact form confirmation',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const footerNote = { fontSize: '14px', color: '#475569', margin: '0' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
