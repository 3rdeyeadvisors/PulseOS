/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for PulseOS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={headerTitle}>⚡ Welcome to PulseOS</Heading>
        </Section>
        <Section style={body}>
          <Text style={text}>
            Thanks for signing up! Please confirm your email address (
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
            ) by clicking the button below:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify Email →
          </Button>
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f1f5f9', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '40px 20px' }
const container = { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, maxWidth: '600px', margin: '0 auto' }
const header = { padding: '40px 40px 24px', textAlign: 'center' as const, background: 'linear-gradient(135deg, #E04F3E 0%, #C43E30 100%)' }
const headerTitle = { margin: '0', fontSize: '28px', fontWeight: '700' as const, color: '#ffffff' }
const body = { padding: '32px 40px 40px' }
const text = { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#E04F3E', textDecoration: 'underline' }
const button = { backgroundColor: '#E04F3E', color: '#ffffff', fontSize: '16px', fontWeight: '700' as const, borderRadius: '12px', padding: '16px 48px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#64748b', margin: '30px 0 0' }
