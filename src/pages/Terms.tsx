import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">PulseOS</span>
          </Link>
          
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 8, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using PulseOS ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use our Service. We reserve the right to update 
              these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              PulseOS is a personal life dashboard application that provides personalized weather updates, 
              news recommendations, task management, AI-powered assistance, and other lifestyle features. 
              The Service is provided "as is" and may be modified, suspended, or discontinued at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You may not share your account with others or create multiple accounts</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code or harmful content</li>
              <li>Impersonate any person or entity</li>
              <li>Use automated means to access the Service without permission</li>
              <li>Violate the intellectual property rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality of the Service, including but not limited to text, 
              graphics, logos, icons, and software, are owned by PulseOS or its licensors and are protected 
              by copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of content you create through the Service (tasks, messages, etc.). 
              By using the Service, you grant us a limited license to process your content as necessary 
              to provide the Service. We do not claim ownership of your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service integrates with third-party APIs and services (weather, news, AI, etc.). 
              We are not responsible for the availability, accuracy, or content provided by these 
              third-party services. Your use of such services is subject to their respective terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
              ERROR-FREE, OR SECURE. INFORMATION PROVIDED THROUGH THE SERVICE (WEATHER, NEWS, 
              RECOMMENDATIONS) IS FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT BE RELIED UPON 
              FOR CRITICAL DECISIONS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PULSEOS SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO 
              YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless PulseOS and its officers, directors, employees, 
              and agents from any claims, damages, losses, or expenses arising from your use of the 
              Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access to the Service at any time, with or without cause, 
              with or without notice. Upon termination, your right to use the Service will immediately cease. 
              You may delete your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions. Any disputes shall be resolved in the courts 
              of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@pulseos.tech" className="text-primary hover:underline">
                support@pulseos.tech
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 PulseOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}