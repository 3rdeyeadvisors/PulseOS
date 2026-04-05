import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; daysSinceActive?: number }

const InactiveReminderEmail = ({ name, daysSinceActive }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We miss you, {name || 'there'}! 👋</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>Hey {name || 'there'}! 👋</Heading></Section>
        <Section style={body}>
          <Text style={text}>It's been {daysSinceActive || 'a few'} days since we last saw you on PulseOS. Your daily insights, recommendations, and friends are waiting!</Text>
          <Section style={card}><Text style={cardText}>Your streak needs attention!</Text><Text style={cardCta}>🔥 Come back today</Text></Section>
          <Button style={button} href="https://pulseos.tech/app">Open Your Dashboard →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>You haven't visited recently. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: InactiveReminderEmail as React.ComponentType<Record<string, unknown>>, subject: (data: Record<string, unknown>) => `We miss you, ${data.name || 'there'}! 👋`, displayName: 'Inactive reminder', previewData: { name: 'Jane', daysSinceActive: 5 } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }
const card = { backgroundColor: '#fef2f2', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, marginBottom: '24px' }
const cardText = { color: '#1e293b', fontSize: '14px', margin: '0 0 8px' }
const cardCta = { color: '#F0A020', fontSize: '24px', fontWeight: '700' as const, margin: '0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
