import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { createPhishingCampaign, type CreateCampaignPayload } from './api';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

const TEMPLATE_PRESETS = [
  { value: 'password-reset', label: 'Password Reset', desc: 'Password expiration notice with reset button' },
  { value: 'it-helpdesk', label: 'IT Helpdesk', desc: 'Urgent account verification request' },
  { value: 'ceo-urgent', label: 'CEO Urgent', desc: 'CEO requesting document review before EOD' },
  { value: 'mfa-verify', label: 'MFA Verify', desc: 'Multi-factor authentication re-verification' },
  { value: 'custom', label: 'Custom Template', desc: 'Write your own HTML email template' },
];

const LANDING_PRESETS = [
  { value: 'generic-login', label: 'Generic Login', desc: 'Simple sign-in page' },
  { value: 'o365-login', label: 'Office 365', desc: 'Microsoft 365 login page' },
  { value: 'google-login', label: 'Google Login', desc: 'Google sign-in page' },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCampaignPayload>({
    name: '',
    target: '',
    recipients: '',
    templatePreset: 'password-reset',
    landingPreset: 'generic-login',
    durationMinutes: 60,
    captureCredentials: true,
    capturePasswords: false,
  });

  const mutation = useMutation({
    mutationFn: createPhishingCampaign,
    onSuccess: (campaign) => {
      toast.success('Campaign created');
      navigate({
        to: '/phishing/$campaignId',
        params: { campaignId: campaign.id },
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create campaign');
    },
  });

  const update = (patch: Partial<CreateCampaignPayload>) =>
    setForm((f) => ({ ...f, ...patch }));

  const recipientCount = form.recipients
    .split(';')
    .filter((r) => r.trim() && r.includes('@')).length;

  return (
    <Page
      title={
        <div className="flex items-center gap-2">
          <Link to="/phishing">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          New Imperius Campaign
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Campaign Details</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Q4 Security Awareness Test"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="target">Target Domain</Label>
              <Input
                id="target"
                placeholder="example.com"
                value={form.target}
                onChange={(e) => update({ target: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="desc">Description (optional)</Label>
              <Input
                id="desc"
                placeholder="Brief description of the campaign"
                value={form.description ?? ''}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Recipients */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Recipients</h3>
          <div>
            <Label htmlFor="recipients">
              Recipients (CSV format, semicolon-separated)
            </Label>
            <Textarea
              id="recipients"
              rows={6}
              placeholder={`ali@example.com,Ali,Yilmaz,IT Manager;\nayse@example.com,Ayse,Demir,CFO;\ncan@example.com,Can,Kaya,Developer`}
              value={form.recipients}
              onChange={(e) => update({ recipients: e.target.value })}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Format: email,first_name,last_name,position — separated by
              semicolons. {recipientCount > 0 && <strong>{recipientCount} recipients</strong>}
            </p>
          </div>
        </section>

        {/* Email Template */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Email Template</h3>
          <div>
            <Label>Template Preset</Label>
            <Select
              value={form.templatePreset}
              onValueChange={(v) => update({ templatePreset: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_PRESETS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <span className="font-medium">{t.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.templatePreset === 'custom' && (
            <>
              <div>
                <Label htmlFor="customSubject">Email Subject</Label>
                <Input
                  id="customSubject"
                  placeholder="Important: Action Required"
                  value={form.customSubject ?? ''}
                  onChange={(e) => update({ customSubject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customHTML">Email HTML Body</Label>
                <Textarea
                  id="customHTML"
                  rows={10}
                  placeholder="<html><body>Use {{.FirstName}} and {{.URL}} placeholders...</body></html>"
                  value={form.customHTML ?? ''}
                  onChange={(e) => update({ customHTML: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </>
          )}
        </section>

        {/* Landing Page */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Landing Page</h3>
          <div>
            <Label>Landing Page Preset</Label>
            <Select
              value={form.landingPreset}
              onValueChange={(v) => update({ landingPreset: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANDING_PRESETS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    <span className="font-medium">{l.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {l.desc}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Campaign Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={1440}
                value={form.durationMinutes}
                onChange={(e) =>
                  update({ durationMinutes: parseInt(e.target.value) || 60 })
                }
              />
            </div>
            <div>
              <Label htmlFor="redirect">Redirect URL (optional)</Label>
              <Input
                id="redirect"
                placeholder="https://real-login.example.com"
                value={form.redirectURL ?? ''}
                onChange={(e) => update({ redirectURL: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.captureCredentials}
                onCheckedChange={(v) => update({ captureCredentials: v })}
              />
              <Label>Capture Credentials</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.capturePasswords}
                onCheckedChange={(v) => update({ capturePasswords: v })}
              />
              <Label>Capture Passwords</Label>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link to="/phishing">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={
              mutation.isPending ||
              !form.name ||
              !form.target ||
              recipientCount === 0
            }
          >
            {mutation.isPending ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </Page>
  );
}
