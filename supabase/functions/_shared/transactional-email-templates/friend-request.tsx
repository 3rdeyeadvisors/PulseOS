import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { receiverName?: string; senderName?: string; senderUsername?: string }

const FriendRequestEmail = ({ receiverName, senderName, senderUsername }: Props) => {
  const senderDisplay = senderUsername ? `${senderName} (@${senderUsername})` : senderName
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{senderName || 'Someone'} wants to be your friend on PulseOS!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Heading style={h1}>👋 New Friend Request!</Heading></Section>
          <Section style={body}>
            <Text style={text}>Hey {receiverName || 'there'}! 👋</Text>
            <Section style={card}><Text style={cardTitle}>{senderDisplay || 'Someone'}</Text><Text style={cardText}>wants to connect with you on PulseOS</Text></Section>
            <Text style={text}>Once you accept, you can compete on weekly leaderboards, send activity invites, and see each other's progress!</Text>
            <Button style={button} href="https://pulseos.tech/app/friends">View Friend Request →</Button>
          </Section>
          <Section style={footer}><Text style={footerText}>You're receiving this because someone sent you a friend request.</Text></Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FriendRequestEmail,
  subject: (data: Record<string, any>) => `${data.senderName || 'Someone'} wants to be your friend on PulseOS! 👋`,
  displayName: 'Friend request',
  previewData: { receiverName: 'Jane', senderName: 'John', senderUsername: 'john123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const card = { padding: '20px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #E04F3E', marginBottom: '20px' }
const cardTitle = { color: '#C43E30', fontSize: '18px', fontWeight: '700' as const, margin: '0 0 8px' }
const cardText = { color: '#E04F3E', fontSize: '15px', margin: '0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
