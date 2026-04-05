import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; taskCount?: number; tasks?: string[] }

const OverdueTaskReminderEmail = ({ name, taskCount, tasks }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>📋 Your incomplete tasks from yesterday ({taskCount || 0})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>⏰ Tasks From Yesterday</Heading></Section>
        <Section style={body}>
          <Text style={text}>Hey {name || 'there'}! 👋</Text>
          <Text style={text}>You have <strong style={{color:'#E04F3E'}}>{taskCount || 0} task{(taskCount || 0) > 1 ? 's' : ''}</strong> from yesterday that still need your attention.</Text>
          {tasks && tasks.length > 0 ? <Section style={card}>{tasks.slice(0, 5).map((t, i) => <Text key={i} style={taskItem}>☐ {t}</Text>)}{(taskCount || 0) > 5 ? <Text style={moreText}>...and {(taskCount || 0) - 5} more</Text> : null}</Section> : null}
          <Button style={button} href="https://pulseos.tech/app">Complete Your Tasks →</Button>
          <Text style={hint}>Small steps lead to big progress. Let's get these done! 💪</Text>
        </Section>
        <Section style={footer}><Text style={footerText}>Task reminders enabled. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: OverdueTaskReminderEmail as React.ComponentType<Record<string, unknown>>, subject: (data: Record<string, unknown>) => `📋 Your incomplete tasks from yesterday (${data.taskCount || 0})`, displayName: 'Overdue task reminder', previewData: { name: 'Jane', taskCount: 3, tasks: ['Review report', 'Call dentist', 'Buy groceries'] } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const card = { padding: '16px', backgroundColor: '#fef2f2', borderRadius: '12px', marginBottom: '24px' }
const taskItem = { color: '#1e293b', fontSize: '15px', margin: '0 0 8px', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px' }
const moreText = { color: '#64748b', fontSize: '14px', textAlign: 'center' as const, margin: '8px 0 0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const hint = { color: '#64748b', fontSize: '14px', textAlign: 'center' as const, margin: '16px 0 0' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
