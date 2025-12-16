import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 14, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to PulseOS ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
              the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our personal life dashboard application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mb-2 text-foreground">Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Email address:</strong> Used for account authentication, password recovery, and important notifications</li>
              <li><strong>Name:</strong> Used for personalization and display within the app</li>
              <li><strong>Password:</strong> Encrypted and stored securely for account access</li>
              <li><strong>Username:</strong> Optional, used for community features and friend connections</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">Location Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>City and State:</strong> Used to provide localized weather forecasts, news, restaurant recommendations, and local events</li>
              <li><strong>Zip Code:</strong> Used for more accurate local recommendations (stored securely, never shared publicly)</li>
              <li><strong>Approximate Location:</strong> Derived from your provided city for service personalization</li>
            </ul>
            <p className="text-muted-foreground mt-2 text-sm bg-muted/30 p-3 rounded-lg">
              <strong>Note:</strong> We do not use GPS or precise device location. All location data is manually provided by you and can be updated or deleted at any time in Settings.
            </p>
            
            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">Profile & Preferences</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Age range and household type:</strong> Used to personalize recommendations</li>
              <li><strong>Dietary preferences:</strong> Used for restaurant and food recommendations</li>
              <li><strong>Interests:</strong> Used to tailor content and suggestions</li>
              <li><strong>Theme and display settings:</strong> Used to customize your app experience</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">User-Generated Content</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Tasks:</strong> Your to-do items and task completion status</li>
              <li><strong>Chat messages:</strong> Conversations with our AI assistant (used to provide contextual responses)</li>
              <li><strong>Profile photo:</strong> Optional avatar image you upload</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide personalized weather forecasts based on your city</li>
              <li>Deliver relevant local news and events</li>
              <li>Generate restaurant and food recommendations matching your preferences</li>
              <li>Power our AI assistant with context-aware responses</li>
              <li>Send notifications and task reminders based on your preferences</li>
              <li>Enable social features like friend connections and leaderboards</li>
              <li>Improve and optimize our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Services & Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. To provide our services, we share limited data with the following third-party providers:
            </p>
            
            <h3 className="text-lg font-medium mb-2 text-foreground">Weather Services</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>OpenWeather API:</strong> Receives your city name to provide weather forecasts</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">Location & Places</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Google Places API:</strong> Receives your city/area to find local restaurants and businesses</li>
              <li><strong>HERE API:</strong> Used for geocoding (converting city names to coordinates)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">News & Entertainment</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>News API:</strong> Provides news articles based on your interests</li>
              <li><strong>TMDB (The Movie Database):</strong> Provides movie and TV recommendations</li>
              <li><strong>Ticketmaster API:</strong> Provides local event information based on your city</li>
              <li><strong>Spotify:</strong> Provides music recommendations (if connected)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">AI Services</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Perplexity AI:</strong> Processes chat messages to generate AI assistant responses</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">Email Services</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Resend:</strong> Sends transactional emails (welcome, password reset, notifications)</li>
            </ul>

            <p className="text-muted-foreground mt-4 text-sm bg-muted/30 p-3 rounded-lg">
              <strong>Data Minimization:</strong> We only share the minimum information necessary for each service to function. For example, weather services only receive your city name, not your full address or personal details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>End-to-end encryption for data transmission (HTTPS/TLS)</li>
              <li>Secure password hashing using industry-standard algorithms</li>
              <li>Row-level security policies ensuring you can only access your own data</li>
              <li>Regular security audits and monitoring</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Your Rights & Data Control</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> View all your personal data in the Settings section</li>
              <li><strong>Update:</strong> Modify your profile, preferences, and location at any time</li>
              <li><strong>Delete:</strong> Permanently delete your account and all associated data from Settings → Profile → Delete Account</li>
              <li><strong>Opt out:</strong> Disable email notifications in Settings → Notifications</li>
              <li><strong>Privacy controls:</strong> Choose what information is visible to other users in Settings → Profile → Privacy Settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential browser storage (localStorage) to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Maintain your login session</li>
              <li>Store your theme preferences</li>
              <li>Cache data for faster loading</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not use third-party tracking cookies or advertising pixels. We do not share data with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              PulseOS is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we become aware that a child under 13 has 
              provided us with personal information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data for as long as your account is active. When you delete your account:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>All personal data is permanently deleted within 30 days</li>
              <li>Backup copies are purged within 90 days</li>
              <li>Anonymized usage statistics may be retained for service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page, updating the "Last updated" date, and 
              sending you an in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, your data, or wish to exercise your rights, please contact us:
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-2 mt-4">
              <li><strong>Email:</strong>{' '}
                <a href="mailto:privacy@pulseos.tech" className="text-primary hover:underline">
                  privacy@pulseos.tech
                </a>
              </li>
              <li><strong>Support:</strong>{' '}
                <a href="mailto:support@pulseos.tech" className="text-primary hover:underline">
                  support@pulseos.tech
                </a>
              </li>
              <li><strong>Contact Form:</strong>{' '}
                <Link to="/contact" className="text-primary hover:underline">
                  pulseos.app/contact
                </Link>
              </li>
            </ul>
          </section>

          {/* Apple App Store Privacy Disclosure Summary */}
          <section className="border border-border/50 rounded-xl p-6 bg-card/50">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">App Privacy Summary</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For Apple App Store transparency, here is a summary of data we collect:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-2">Data Linked to You</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Contact Info (email, name)</li>
                  <li>• User Content (tasks, messages)</li>
                  <li>• Identifiers (user ID)</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-2">Data Used to Track You</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• None - We do not track you</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-2">Location Data</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Coarse Location (city level)</li>
                  <li>• User-provided, not GPS</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-2">Data Not Collected</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Precise Location (GPS)</li>
                  <li>• Health & Fitness</li>
                  <li>• Financial Info</li>
                  <li>• Browsing History</li>
                </ul>
              </div>
            </div>
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
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}