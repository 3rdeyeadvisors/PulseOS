import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, ArrowLeft, Send, Loader2, Mail, MessageSquare } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters"),
});

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = contactSchema.safeParse({ name, email, subject, message });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('contact-form', {
        body: { name, email, subject, message },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (error: any) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[100px]" />
      </div>

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
      <main className="container mx-auto px-4 py-12 max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </div>

        {submitted ? (
          <Card className="border-border/50 shadow-card">
            <CardContent className="pt-6 text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for reaching out. We'll get back to you within 24-48 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
                <Link to="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll respond as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What is this regarding?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your question or feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={5000}
                    rows={6}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/5000
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Direct contact info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            You can also reach us directly at{' '}
            <a 
              href="mailto:support@notifications.pulseos.tech" 
              className="text-primary hover:underline"
            >
              support@notifications.pulseos.tech
            </a>
          </p>
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