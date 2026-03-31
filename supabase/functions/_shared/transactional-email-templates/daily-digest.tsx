import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; score?: number; tasksCompleted?: number; tasksTotal?: number; scoreMessage?: string }

const DailyDigestEmail = ({ name, score, tasksCompleted, tasksTotal, scoreMessage }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Daily Pulse - Score: {score || 0}/100</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>⚡ Good morning, {name || 'there'}!</Heading></Section>
        <Section style={body}>
          <Section style={scoreCard}>
            <Text style={scoreLabel}>YESTERDAY'S ACTION SCORE</Text>
            <Text style={scoreValue}>{score || 0}</Text>
            <Text style={scoreOut}>out of 100</Text>
            <Text style={scoreMsg}>{scoreMessage || 'Keep going!'}</Text>
            <Text style={taskCount}>Tasks completed: {tasksCompleted || 0}/{tasksTotal || 0}</Text>
          </Section>
          <Button style={button} href="https://pulseos.tech/app">Start Today's Actions →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>You opted in to daily digests. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: DailyDigestEmail, subject: (data: Record<string, any>) => `📊 Your Daily Pulse - Score: ${data.score || 0}/100`, displayName: 'Daily digest', previewData: { name: 'Jane', score: 75, tasksCompleted: 3, tasksTotal: 5, scoreMessage: 'Good progress!' } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '24px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const scoreCard = { padding: '28px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderRadius: '16px', border: '2px solid #fecaca', textAlign: 'center' as const, marginBottom: '24px' }
const scoreLabel = { color: '#E04F3E', fontSize: '12px', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 12px' }
const scoreValue = { fontSize: '56px', fontWeight: '800' as const, margin: '0', color: '#E04F3E' }
const scoreOut = { color: '#64748b', fontSize: '14px', margin: '8px 0 16px' }
const scoreMsg = { color: '#1e293b', fontSize: '16px', margin: '0 0 8px' }
const taskCount = { color: '#64748b', fontSize: '14px', margin: '0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
