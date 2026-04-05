import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { title?: string; content?: string; ctaText?: string; ctaUrl?: string }

const NotificationEmail = ({ title, content, ctaText, ctaUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'Notification from PulseOS'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}><Text style={logo}>⚡ PulseOS</Text></Section>
        <Section style={body}>
          <Heading style={h1}>{title || 'Notification'}</Heading>
          <Text style={text}>{content || ''}</Text>
          {ctaText && ctaUrl ? <Button style={button} href={ctaUrl}>{ctaText}</Button> : null}
        </Section>
        <Section style={footer}><Text style={footerText}>You have notifications enabled. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NotificationEmail as React.ComponentType<Record<string, unknown>>,
  subject: (data: Record<string, unknown>) => (data.emailSubject as string) || (data.title as string) || 'Notification from PulseOS',
  displayName: 'General notification',
  previewData: { title: 'Task Completed', content: 'Your task has been completed successfully.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const headerSection = { padding: '32px 40px 24px', borderBottom: '1px solid #e2e8f0' }
const logo = { color: '#1e293b', fontSize: '20px', fontWeight: '700' as const, margin: '0' }
const body = { padding: '32px 40px 40px' }
const h1 = { color: '#1e293b', fontSize: '24px', fontWeight: '600' as const, margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.7', margin: '0 0 24px' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'inline-block' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
