import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { resetLink?: string; formattedCode?: string }

const PasswordResetEmail = ({ resetLink, formattedCode }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset Your Password - PulseOS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={h1}>🔐 Reset Your Password</Heading></Section>
        <Section style={body}>
          <Text style={text}>We received a request to reset your password for PulseOS. Click the button below to set a new password.</Text>
          {resetLink ? <Button style={button} href={resetLink}>Reset Password →</Button> : null}
          {formattedCode ? <Text style={codeText}>Or enter this code manually: <strong style={{color:'#1e293b'}}>{formattedCode}</strong></Text> : null}
          <Text style={expiry}>This code expires in 1 hour.</Text>
          <Text style={footerNote}>If you didn't request this, you can safely ignore this email.</Text>
        </Section>
        <Section style={footer}><Text style={footerText}>This is an automated message from PulseOS.</Text></Section>
      </Container>
    </Body>
  </Html>
)

export const template = { component: PasswordResetEmail, subject: 'Reset Your Password - PulseOS', displayName: 'Password reset', previewData: { resetLink: 'https://pulseos.tech/reset-password?code=ABCD1234', formattedCode: 'ABCD-1234' } } satisfies TemplateEntry

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const h1 = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.7', margin: '0 0 24px' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none', display: 'block', textAlign: 'center' as const, marginBottom: '24px' }
const codeText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0 0 8px' }
const expiry = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0 0 8px' }
const footerNote = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
const footer = { padding: '25px 40px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
const footerText = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '0' }
