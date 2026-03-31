import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string }

const VerifiedThankYouEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🎉 You're Verified! Grandfathered for Life</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>⚡ PulseOS</Heading>
          <Section style={badge}><Text style={badgeText}>✓ Verified Member</Text></Section>
        </Section>
        <Section style={body}>
          <Heading style={h2}>You're Officially Verified! 🎉</Heading>
          <Text style={text}>Hey {name || 'there'},</Text>
          <Text style={text}>Thank you for being one of our <strong style={{color:'#E04F3E'}}>early adopters</strong>. Your support means everything.</Text>
          <Section style={rewardCard}>
            <Text style={rewardLabel}>YOUR REWARD</Text>
            <Text style={rewardTitle}>🏆 Grandfathered for Life</Text>
            <Text style={rewardText}>You'll <strong>never pay</strong> for PulseOS. Full access locked in forever.</Text>
          </Section>
          <Text style={listTitle}>What you get forever:</Text>
          <Text style={listItem}>✓ Verified blue checkmark</Text>
          <Text style={listItem}>✓ Full access to all features</Text>
          <Text style={listItem}>✓ Priority support</Text>
          <Text style={listItem}>✓ Early access to new features</Text>
          <Button style={button} href="https://pulseos.tech/app">Open PulseOS →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>Thank you for believing in us from the start. — The PulseOS Team</Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: VerifiedThankYouEmail, subject: '🎉 You\'re Verified! Grandfathered for Life', displayName: 'Verified thank you', previewData: { name: 'Jane' } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0 0 16px', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const badge = { display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '50px' }
const badgeText = { color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, margin: '0' }
const body = { padding: '32px 40px 40px' }
const h2 = { color: '#1e293b', fontSize: '24px', fontWeight: '700' as const, margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.7', margin: '0 0 20px' }
const rewardCard = { padding: '24px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' as const, marginBottom: '24px' }
const rewardLabel = { color: '#E04F3E', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: '600' as const, margin: '0 0 8px' }
const rewardTitle = { color: '#1e293b', fontSize: '22px', fontWeight: '700' as const, margin: '0 0 12px' }
const rewardText = { color: '#E04F3E', fontSize: '15px', margin: '0' }
const listTitle = { color: '#1e293b', fontSize: '18px', fontWeight: '600' as const, margin: '0 0 12px' }
const listItem = { color: '#475569', fontSize: '15px', margin: '0 0 8px', paddingLeft: '4px' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const, marginTop: '24px' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
