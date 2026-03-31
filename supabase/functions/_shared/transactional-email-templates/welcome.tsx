import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "PulseOS"

interface Props { name?: string }

const WelcomeEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} - Your Personal Life Dashboard 🚀</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>⚡ Welcome to PulseOS</Heading></Section>
        <Section style={body}>
          <Text style={text}>Hey {name || 'there'}! 👋</Text>
          <Text style={text}>Welcome to your personal life dashboard. PulseOS helps you stay on top of everything that matters - from weather and news to events and daily recommendations.</Text>
          <Section style={featureBox}><Text style={featureTitle}>🌤️ Weather & Location</Text><Text style={featureText}>Real-time weather updates for your area</Text></Section>
          <Section style={featureBox}><Text style={featureTitle}>📰 Personalized News</Text><Text style={featureText}>News curated based on your interests</Text></Section>
          <Section style={featureBox}><Text style={featureTitle}>🤖 AI Assistant</Text><Text style={featureText}>Chat with Pulse for personalized insights</Text></Section>
          <Button style={button} href="https://pulseos.tech/app">Open Your Dashboard →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>You're receiving this because you signed up for PulseOS.</Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to PulseOS - Your Personal Life Dashboard 🚀',
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const featureBox = { padding: '15px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '12px' }
const featureTitle = { color: '#E04F3E', fontSize: '14px', fontWeight: '600' as const, margin: '0 0 4px' }
const featureText = { color: '#475569', fontSize: '14px', margin: '0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const, marginTop: '24px' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
