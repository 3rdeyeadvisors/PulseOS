import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; taskTitle?: string; dueDate?: string }

const TaskReminderEmail = ({ name, taskTitle, dueDate }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Task Reminder: {taskTitle || 'Your task'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>📋 Task Reminder</Heading></Section>
        <Section style={body}>
          <Text style={text}>Hey {name || 'there'}! 👋</Text>
          <Text style={text}>Just a friendly reminder about your task:</Text>
          <Section style={card}><Text style={cardTitle}>{taskTitle || 'Task'}</Text>{dueDate ? <Text style={cardText}>📅 Due: {dueDate}</Text> : null}</Section>
          <Button style={button} href="https://pulseos.tech/app">View Your Tasks →</Button>
        </Section>
        <Section style={footer}><Text style={footerText}>Task reminders enabled. <a href="https://pulseos.tech/app/settings" style={{color:'#E04F3E'}}>Manage preferences</a></Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: TaskReminderEmail as React.ComponentType<Record<string, unknown>>, subject: (data: Record<string, unknown>) => `Task Reminder: ${data.taskTitle || 'Your task'}`, displayName: 'Task reminder', previewData: { name: 'Jane', taskTitle: 'Review weekly report', dueDate: 'Jan 15, 2026' } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #F0A020 0%, #D97706 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px' }
const card = { padding: '20px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '2px solid #F0A020', marginBottom: '24px' }
const cardTitle = { color: '#92400e', fontSize: '18px', fontWeight: '600' as const, margin: '0 0 8px' }
const cardText = { color: '#92400e', fontSize: '14px', margin: '0' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
