import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { senderName?: string; accepterName?: string; activityName?: string; activityType?: string; proposedTime?: string }

const InviteAcceptedEmail = ({ senderName, accepterName, activityName, proposedTime }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🎉 {accepterName || 'Someone'} accepted your invite to {activityName || 'an activity'}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>🎉 It's On!</Heading></Section>
        <Section style={body}>
          <Text style={text}>Great news, {senderName || 'there'}! 🎊</Text>
          <Text style={text}><strong style={{color:'#E04F3E'}}>{accepterName || 'Your friend'}</strong> accepted your invite!</Text>
          <Section style={card}>
            <Text style={cardTitle}>{activityName || 'Activity'}</Text>
            {proposedTime ? <Text style={cardText}>📅 {proposedTime}</Text> : null}
            <Text style={cardText}>👥 With: {accepterName}</Text>
          </Section>
          <Button style={button} href="https://pulseos.tech/app/friends">View Upcoming Plans →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>Your activity invite was accepted.</Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InviteAcceptedEmail,
  subject: (data: Record<string, any>) => `🎉 ${data.accepterName || 'Someone'} accepted your invite to ${data.activityName || 'an activity'}!`,
  displayName: 'Invite accepted',
  previewData: { senderName: 'John', accepterName: 'Jane', activityName: 'Coffee', proposedTime: 'Saturday, Jan 15 at 2:00 PM' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const card = { padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #E04F3E', marginBottom: '24px' }
const cardTitle = { color: '#C43E30', fontSize: '20px', fontWeight: '600' as const, margin: '0 0 12px' }
const cardText = { color: '#1e293b', fontSize: '14px', margin: '0 0 8px' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
