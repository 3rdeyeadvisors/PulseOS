import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; userScore?: number; topFriendName?: string; topFriendScore?: number; scoreDiff?: number; friendsAheadCount?: number }

const LeaderboardReminderEmail = ({ name, userScore, topFriendName, topFriendScore, scoreDiff, friendsAheadCount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>📊 You're {scoreDiff || 0} points behind {topFriendName || 'a friend'}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>📊 Leaderboard Update</Heading></Section>
        <Section style={body}>
          <Text style={text}>Hey {name || 'there'}! 👋</Text>
          <Text style={text}>Your friend <strong style={{color:'#E04F3E'}}>{topFriendName || 'a friend'}</strong> is currently ahead on the leaderboard!</Text>
          <Section style={scoreCard}><Text style={scoreLabel}>YOUR SCORE</Text><Text style={scoreValue}>{userScore || 0}</Text><Text style={scoreOut}>points</Text></Section>
          <Section style={rivalCard}><Text style={rivalLabel}>🏆 {topFriendName}'s Score</Text><Text style={rivalScore}>{topFriendScore || 0} pts</Text><Text style={rivalDiff}>You're <strong>{scoreDiff || 0} points</strong> behind!</Text></Section>
          {(friendsAheadCount || 0) > 1 ? <Text style={moreText}>{(friendsAheadCount || 0) - 1} other friend{(friendsAheadCount || 0) > 2 ? 's are' : ' is'} also ahead.</Text> : null}
          <Button style={button} href="https://pulseos.tech/app/friends">View Leaderboard →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>Leaderboard reminders enabled. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: LeaderboardReminderEmail as React.ComponentType<Record<string, unknown>>, subject: (data: Record<string, unknown>) => `📊 You're ${data.scoreDiff || 0} points behind ${data.topFriendName || 'a friend'}!`, displayName: 'Leaderboard reminder', previewData: { name: 'Jane', userScore: 45, topFriendName: 'John', topFriendScore: 78, scoreDiff: 33, friendsAheadCount: 2 } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const scoreCard = { padding: '20px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '12px', border: '2px solid #fecaca', textAlign: 'center' as const, marginBottom: '16px' }
const scoreLabel = { color: '#E04F3E', fontSize: '12px', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 8px' }
const scoreValue = { fontSize: '36px', fontWeight: '800' as const, margin: '0', color: '#E04F3E' }
const scoreOut = { color: '#64748b', fontSize: '14px', margin: '4px 0 0' }
const rivalCard = { padding: '20px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '2px solid #fecaca', marginBottom: '24px' }
const rivalLabel = { color: '#C43E30', fontSize: '14px', fontWeight: '600' as const, margin: '0 0 8px' }
const rivalScore = { fontSize: '28px', fontWeight: '700' as const, margin: '0', color: '#C43E30' }
const rivalDiff = { margin: '8px 0 0', color: '#E04F3E', fontSize: '14px' }
const moreText = { color: '#64748b', fontSize: '14px', margin: '0 0 24px' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
