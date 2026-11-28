import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  Mail,
  Users,
  MousePointerClick,
  Settings,
  ClipboardCheck,
  Eye,
  Code,
  Pencil,
  Copy,
  Save,
  BookTemplate,
  X,
} from 'lucide-react';
import { useState, useRef, useCallback, useMemo } from 'react';
import {
  createPhishingCampaign,
  getPhishingTemplates,
  savePhishingTemplate,
  type CreateCampaignPayload,
  type PhishingTemplateItem,
} from './api';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Recipient {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'details', label: 'Campaign', icon: Settings },
  { id: 'recipients', label: 'Recipients', icon: Users },
  { id: 'template', label: 'Email Template', icon: Mail },
  { id: 'landing', label: 'Landing Page', icon: MousePointerClick },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
] as const;

const TEMPLATE_VARIABLES = [
  { key: '{{.FirstName}}', label: 'First Name', desc: "Recipient's first name" },
  { key: '{{.LastName}}', label: 'Last Name', desc: "Recipient's last name" },
  { key: '{{.Position}}', label: 'Position', desc: "Recipient's job title" },
  { key: '{{.Email}}', label: 'Email', desc: "Recipient's email address" },
  { key: '{{.URL}}', label: 'Phishing URL', desc: 'Tracking link (required)' },
  { key: '{{.From}}', label: 'From Address', desc: 'Sender email address' },
];

const EMAIL_PRESETS = [
  {
    value: 'password-reset',
    label: 'Password Reset',
    category: 'Credentials',
    desc: 'Password expiration notice with reset button',
  },
  {
    value: 'it-helpdesk',
    label: 'IT Helpdesk',
    category: 'Credentials',
    desc: 'Unusual activity detection, verify identity',
  },
  {
    value: 'mfa-verify',
    label: 'MFA Verify',
    category: 'Credentials',
    desc: 'Multi-factor authentication re-verification',
  },
  {
    value: 'security-alert',
    label: 'Security Alert',
    category: 'Credentials',
    desc: 'Suspicious login from foreign country',
  },
  {
    value: 'ceo-urgent',
    label: 'CEO Urgent',
    category: 'Social Engineering',
    desc: 'CEO requesting document review before EOD',
  },
  {
    value: 'shared-document',
    label: 'Shared Document',
    category: 'Social Engineering',
    desc: 'Colleague shared a document via OneDrive',
  },
  {
    value: 'calendar-invite',
    label: 'Calendar Invite',
    category: 'Social Engineering',
    desc: 'Important meeting that requires RSVP',
  },
  {
    value: 'invoice-payment',
    label: 'Invoice Payment',
    category: 'Business',
    desc: 'Overdue invoice needs approval from finance',
  },
  {
    value: 'delivery-notification',
    label: 'Delivery Notice',
    category: 'Business',
    desc: 'Package delivery failed, reschedule required',
  },
  {
    value: 'hr-policy-update',
    label: 'HR Policy Update',
    category: 'Business',
    desc: 'New company policy, review and acknowledge',
  },
];

const LANDING_PRESETS = [
  { value: 'generic-login', label: 'Generic Login', desc: 'Simple corporate sign-in page' },
  { value: 'o365-login', label: 'Office 365', desc: 'Microsoft 365 login clone' },
  { value: 'google-login', label: 'Google Login', desc: 'Google sign-in clone' },
  { value: 'outlook-web', label: 'Outlook Web', desc: 'Outlook Web App login' },
  { value: 'dropbox-login', label: 'Dropbox', desc: 'Dropbox sign-in clone' },
  { value: 'docusign-login', label: 'DocuSign', desc: 'DocuSign review document' },
];

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(text: string): Recipient[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const recipients: Recipient[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (/^(email|e-?mail|mail)/i.test(line)) continue;
    const parts = line.includes(';')
      ? line.split(';').map((p) => p.trim())
      : line.split(',').map((p) => p.trim());
    const email = parts[0]?.toLowerCase();
    if (!email || !email.includes('@')) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    recipients.push({
      email,
      firstName: parts[1] || '',
      lastName: parts[2] || '',
      position: parts[3] || '',
    });
  }
  return recipients;
}

function recipientsToPayload(recipients: Recipient[]): string {
  return recipients
    .map((r) => [r.email, r.firstName, r.lastName, r.position].join(','))
    .join(';');
}

// ─── Template Preview ────────────────────────────────────────────────────────

function TemplatePreview({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const previewHtml = useMemo(() => {
    return html
      .replace(/\{\{\.FirstName\}\}/g, 'John')
      .replace(/\{\{\.LastName\}\}/g, 'Smith')
      .replace(/\{\{\.Position\}\}/g, 'IT Manager')
      .replace(/\{\{\.Email\}\}/g, 'john.smith@acme.com')
      .replace(/\{\{\.URL\}\}/g, '#')
      .replace(/\{\{\.From\}\}/g, 'security@company.com');
  }, [html]);

  return (
    <iframe
      srcDoc={previewHtml}
      sandbox=""
      className={cn('w-full rounded border bg-white', className)}
      title="Template Preview"
    />
  );
}

// ─── Template Editor Dialog ──────────────────────────────────────────────────

function TemplateEditorDialog({
  open,
  onOpenChange,
  type,
  initialSubject,
  initialHtml,
  onApply,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'email' | 'landing';
  initialSubject?: string;
  initialHtml: string;
  onApply: (subject: string, html: string) => void;
  onSave?: (name: string, subject: string, html: string) => void;
}) {
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [html, setHtml] = useState(initialHtml);
  const [showPreview, setShowPreview] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when dialog opens with new content
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setSubject(initialSubject ?? '');
      setHtml(initialHtml);
      setShowSaveInput(false);
      setSaveName('');
    }
    onOpenChange(o);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newHtml = html.slice(0, start) + variable + html.slice(end);
    setHtml(newHtml);
    // Restore cursor
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + variable.length;
      ta.focus();
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {type === 'email' ? 'Email Template Editor' : 'Landing Page Editor'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1.5"
              >
                {showPreview ? <Code className="size-4" /> : <Eye className="size-4" />}
                {showPreview ? 'Code Only' : 'Show Preview'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Variable toolbar */}
        {type === 'email' && (
          <div className="shrink-0 border-b bg-muted/30 px-6 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                Insert variable:
              </span>
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="rounded border bg-card px-2 py-0.5 font-mono text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                  title={v.desc}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subject (email only) */}
        {type === 'email' && (
          <div className="shrink-0 border-b px-6 py-3">
            <div className="flex items-center gap-3">
              <Label className="shrink-0 text-sm font-medium">Subject:</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line..."
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Editor + Preview */}
        <div className="flex min-h-0 flex-1">
          {/* Code editor */}
          <div className={cn('flex flex-col', showPreview ? 'w-1/2 border-r' : 'w-full')}>
            <div className="flex items-center justify-between bg-muted/50 px-4 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">HTML</span>
            </div>
            <Textarea
              ref={textareaRef}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono text-xs focus-visible:ring-0"
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="flex w-1/2 flex-col">
              <div className="flex items-center justify-between bg-muted/50 px-4 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Preview</span>
              </div>
              <TemplatePreview html={html} className="min-h-0 flex-1 rounded-none border-0" />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onSave && !showSaveInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveInput(true)}
                  className="gap-1.5"
                >
                  <Save className="size-4" />
                  Save as Template
                </Button>
              )}
              {showSaveInput && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Template name..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-56"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && saveName.trim()) {
                        onSave?.(saveName.trim(), subject, html);
                        setShowSaveInput(false);
                        setSaveName('');
                      }
                      if (e.key === 'Escape') setShowSaveInput(false);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (saveName.trim()) {
                        onSave?.(saveName.trim(), subject, html);
                        setShowSaveInput(false);
                        setSaveName('');
                      }
                    }}
                    disabled={!saveName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveInput(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onApply(subject, html);
                  handleOpenChange(false);
                }}
              >
                Apply Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step 1: Campaign Details ────────────────────────────────────────────────

function StepDetails({
  form,
  update,
}: {
  form: CreateCampaignPayload;
  update: (patch: Partial<CreateCampaignPayload>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Campaign Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your phishing simulation campaign.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            placeholder="Q4 2026 Security Awareness Test"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target">Target Domain *</Label>
          <Input
            id="target"
            placeholder="acme.com"
            value={form.target}
            onChange={(e) => update({ target: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The domain being tested (used for campaign branding)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Campaign Duration</Label>
          <Select
            value={String(form.durationMinutes ?? 60)}
            onValueChange={(v) => update({ durationMinutes: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
              <SelectItem value="480">8 hours</SelectItem>
              <SelectItem value="1440">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            placeholder="Brief description of the campaign goals and scope..."
            value={form.description ?? ''}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Recipients ──────────────────────────────────────────────────────

function StepRecipients({
  recipients,
  setRecipients,
}: {
  recipients: Recipient[];
  setRecipients: (r: Recipient[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualFirst, setManualFirst] = useState('');
  const [manualLast, setManualLast] = useState('');
  const [manualPosition, setManualPosition] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error('No valid email addresses found in file');
          return;
        }
        const existing = new Set(recipients.map((r) => r.email));
        const newOnes = parsed.filter((r) => !existing.has(r.email));
        setRecipients([...recipients, ...newOnes]);
        toast.success(
          `Added ${newOnes.length} recipients (${parsed.length - newOnes.length} duplicates skipped)`,
        );
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [recipients, setRecipients],
  );

  const handlePaste = () => {
    const parsed = parseCSV(pasteText);
    if (parsed.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }
    const existing = new Set(recipients.map((r) => r.email));
    const newOnes = parsed.filter((r) => !existing.has(r.email));
    setRecipients([...recipients, ...newOnes]);
    toast.success(`Added ${newOnes.length} recipients`);
    setPasteText('');
    setPasteMode(false);
  };

  const addManual = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      toast.error('This email is already added');
      return;
    }
    setRecipients([
      ...recipients,
      {
        email,
        firstName: manualFirst.trim(),
        lastName: manualLast.trim(),
        position: manualPosition.trim(),
      },
    ]);
    setManualEmail('');
    setManualFirst('');
    setManualLast('');
    setManualPosition('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Recipients</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add target employees via CSV upload, paste, or manual entry.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <Upload className="size-4" />
          Upload CSV
        </Button>
        <Button variant="outline" onClick={() => setPasteMode(!pasteMode)} className="gap-2">
          <FileSpreadsheet className="size-4" />
          {pasteMode ? 'Hide Paste' : 'Paste List'}
        </Button>
        {recipients.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Remove all ${recipients.length} recipients?`))
                setRecipients([]);
            }}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Clear All ({recipients.length})
          </Button>
        )}
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <strong>CSV format:</strong> email, first_name, last_name, position — one per line.
        Header row is auto-detected and skipped. Both comma and semicolon separators supported.
      </div>

      {pasteMode && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Label>Paste recipients (CSV format)</Label>
          <Textarea
            rows={6}
            placeholder={`ali@acme.com, Ali, Yilmaz, IT Manager\nayse@acme.com, Ayse, Demir, CFO`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPasteMode(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePaste} disabled={!pasteText.trim()}>Add Recipients</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <Label className="mb-3 block text-sm font-medium">Add manually</Label>
        <div className="flex items-end gap-2">
          <div className="flex-[2]">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input
              placeholder="user@acme.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">First Name</Label>
            <Input
              placeholder="Ali"
              value={manualFirst}
              onChange={(e) => setManualFirst(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Last Name</Label>
            <Input
              placeholder="Yilmaz"
              value={manualLast}
              onChange={(e) => setManualLast(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Input
              placeholder="IT Manager"
              value={manualPosition}
              onChange={(e) => setManualPosition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
          </div>
          <Button onClick={addManual} size="icon" className="shrink-0">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {recipients.length > 0 && (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
            <span className="text-sm font-medium">
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">First Name</th>
                  <th className="px-4 py-2 font-medium">Last Name</th>
                  <th className="px-4 py-2 font-medium">Position</th>
                  <th className="w-10 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.email} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{r.email}</td>
                    <td className="px-4 py-2">{r.firstName || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2">{r.lastName || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2">{r.position || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setRecipients(recipients.filter((x) => x.email !== r.email))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recipients.length === 0 && !pasteMode && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <Users className="size-10 text-muted-foreground/40" />
          <p className="font-medium">No recipients added yet</p>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file, paste a list, or add them one by one
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Email Template ──────────────────────────────────────────────────

function StepEmailTemplate({
  form,
  update,
  savedTemplates,
  onSaveTemplate,
}: {
  form: CreateCampaignPayload;
  update: (patch: Partial<CreateCampaignPayload>) => void;
  savedTemplates: PhishingTemplateItem[];
  onSaveTemplate: (name: string, subject: string, html: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSubject, setEditorSubject] = useState('');
  const [editorHtml, setEditorHtml] = useState('');

  const categories = useMemo(() => {
    const cats: Record<string, typeof EMAIL_PRESETS> = {};
    for (const p of EMAIL_PRESETS) {
      (cats[p.category] ??= []).push(p);
    }
    return cats;
  }, []);

  const openEditor = (presetValue: string) => {
    // Clone preset HTML into editor — connector has the actual HTML,
    // frontend just sends the preset name. For editing, we provide a skeleton.
    const skeletons: Record<string, { subject: string; html: string }> = {
      'password-reset': {
        subject: 'Action Required: Password Expiration Notice',
        html: `<html><body>\n<p>Dear {{.FirstName}},</p>\n<p>Your account password is set to expire in <b>24 hours</b>. To avoid any disruption to your access, please reset your password immediately.</p>\n<p><a href="{{.URL}}" style="background-color:#0066cc;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Reset Password Now</a></p>\n<p>If you did not request this change, please contact IT support.</p>\n<p>Best regards,<br>IT Security Team</p>\n</body></html>`,
      },
      'it-helpdesk': {
        subject: 'IT Helpdesk: Urgent Account Verification Required',
        html: `<html><body>\n<p>Hi {{.FirstName}},</p>\n<p>We have detected unusual activity on your account. As a security measure, we need you to verify your identity by logging in through our secure portal.</p>\n<p><a href="{{.URL}}" style="background-color:#28a745;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Verify My Account</a></p>\n<p>This verification is mandatory and must be completed within 24 hours.</p>\n<p>Thank you,<br>IT Helpdesk</p>\n</body></html>`,
      },
      'ceo-urgent': {
        subject: 'Urgent: Action Needed Before EOD',
        html: `<html><body>\n<p>{{.FirstName}},</p>\n<p>I need you to review and approve an important document before end of day. I am in meetings all afternoon so please handle this ASAP.</p>\n<p><a href="{{.URL}}" style="background-color:#dc3545;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Review Document</a></p>\n<p>Thanks,<br>CEO Office</p>\n</body></html>`,
      },
      'mfa-verify': {
        subject: 'Multi-Factor Authentication: Verification Required',
        html: `<html><body>\n<p>Dear {{.FirstName}},</p>\n<p>As part of our security upgrade, all employees are required to re-verify their multi-factor authentication settings.</p>\n<p><a href="{{.URL}}" style="background-color:#6f42c1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Verify MFA Settings</a></p>\n<p>This must be completed by end of business today to maintain access to company systems.</p>\n<p>Regards,<br>Information Security</p>\n</body></html>`,
      },
    };

    const skeleton = skeletons[presetValue] ?? {
      subject: 'Email Subject',
      html: `<html><body>\n<p>Dear {{.FirstName}},</p>\n<p>Your message here...</p>\n<p><a href="{{.URL}}" style="background-color:#0066cc;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Click Here</a></p>\n<p>Best regards,<br>Your Team</p>\n</body></html>`,
    };

    setEditorSubject(form.customSubject || skeleton.subject);
    setEditorHtml(form.customHTML || skeleton.html);
    setEditorOpen(true);
  };

  const handleEditorApply = (subject: string, html: string) => {
    update({
      templatePreset: 'custom',
      customSubject: subject,
      customHTML: html,
    });
  };

  const isCustomActive = form.templatePreset === 'custom' && !!form.customHTML;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Email Template</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a preset or create your own. Click the edit button to customize any template.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setEditorSubject(form.customSubject || '');
            setEditorHtml(
              form.customHTML ||
                `<html><body>\n<p>Dear {{.FirstName}},</p>\n<p>Your message here...</p>\n<p><a href="{{.URL}}" style="background-color:#0066cc;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Click Here</a></p>\n</body></html>`,
            );
            setEditorOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Create from Scratch
        </Button>
      </div>

      {/* Saved templates */}
      {savedTemplates.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookTemplate className="size-4" />
            Saved Templates
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  update({
                    templatePreset: 'custom',
                    customSubject: t.subject ?? '',
                    customHTML: t.html,
                  })
                }
                className={cn(
                  'group rounded-lg border p-4 text-left transition-all hover:border-primary/50',
                  form.templatePreset === 'custom' &&
                    form.customHTML === t.html &&
                    'border-primary bg-primary/5 ring-1 ring-primary/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditorSubject(t.subject ?? '');
                        setEditorHtml(t.html);
                        setEditorOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {t.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                )}
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  Saved
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom active indicator */}
      {isCustomActive && (
        <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-4">
          <Check className="size-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Custom Template Active</p>
            <p className="text-xs text-muted-foreground">
              Subject: {form.customSubject || '(default)'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditor('custom')}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      )}

      {/* Preset categories */}
      {Object.entries(categories).map(([cat, presets]) => (
        <div key={cat}>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">{cat}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => (
              <div
                key={p.value}
                className={cn(
                  'group rounded-lg border p-4 transition-all hover:border-primary/50',
                  form.templatePreset === p.value &&
                    !isCustomActive &&
                    'border-primary bg-primary/5 ring-1 ring-primary/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    className="text-left font-medium"
                    onClick={() => update({ templatePreset: p.value, customHTML: undefined })}
                  >
                    {p.label}
                  </button>
                  <div className="flex gap-1">
                    {form.templatePreset === p.value && !isCustomActive && (
                      <Check className="size-4 text-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => openEditor(p.value)}
                      title="Clone & Edit"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Subject override for presets */}
      {form.templatePreset !== 'custom' && !isCustomActive && (
        <div className="space-y-2">
          <Label>Subject Override (optional)</Label>
          <Input
            placeholder="Leave empty to use default subject"
            value={form.customSubject ?? ''}
            onChange={(e) => update({ customSubject: e.target.value || undefined })}
          />
        </div>
      )}

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        type="email"
        initialSubject={editorSubject}
        initialHtml={editorHtml}
        onApply={handleEditorApply}
        onSave={(name, subject, html) => {
          onSaveTemplate(name, subject, html);
          toast.success(`Template "${name}" saved`);
        }}
      />
    </div>
  );
}

// ─── Step 4: Landing Page ────────────────────────────────────────────────────

function StepLanding({
  form,
  update,
  savedLandingPages,
  onSaveLanding,
}: {
  form: CreateCampaignPayload;
  update: (patch: Partial<CreateCampaignPayload>) => void;
  savedLandingPages: PhishingTemplateItem[];
  onSaveLanding: (name: string, html: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');

  const isCustomLanding = form.landingPreset === 'custom' && !!(form as any).customLandingHTML;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Landing Page</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The page victims see after clicking the phishing link.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setEditorHtml(
              (form as any).customLandingHTML ||
                `<html><head><title>Sign In</title>\n<style>\nbody{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}\n.card{background:#fff;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);width:360px}\ninput{width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}\nbutton{width:100%;padding:12px;background:#0066cc;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;margin-top:16px}\n</style></head><body>\n<div class="card"><h2>Sign In</h2>\n<form method="POST">\n<input name="username" placeholder="Email" type="email" required>\n<input name="password" placeholder="Password" type="password">\n<button type="submit">Sign In</button>\n</form></div>\n</body></html>`,
            );
            setEditorOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Custom Page
        </Button>
      </div>

      {/* Saved landing pages */}
      {savedLandingPages.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookTemplate className="size-4" />
            Saved Pages
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {savedLandingPages.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  update({
                    landingPreset: 'custom',
                    ...(({ customLandingHTML: t.html }) as any),
                  })
                }
                className={cn(
                  'group rounded-lg border p-4 text-left transition-all hover:border-primary/50',
                  isCustomLanding &&
                    (form as any).customLandingHTML === t.html &&
                    'border-primary bg-primary/5 ring-1 ring-primary/20',
                )}
              >
                <span className="font-medium">{t.name}</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Saved
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom landing indicator */}
      {isCustomLanding && (
        <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-4">
          <Check className="size-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Custom Landing Page Active</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditorHtml((form as any).customLandingHTML || '');
              setEditorOpen(true);
            }}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      )}

      {/* Presets */}
      <div className="grid gap-3 sm:grid-cols-3">
        {LANDING_PRESETS.map((l) => (
          <div
            key={l.value}
            className={cn(
              'group rounded-lg border p-4 transition-all hover:border-primary/50',
              form.landingPreset === l.value &&
                !isCustomLanding &&
                'border-primary bg-primary/5 ring-1 ring-primary/20',
            )}
          >
            <div className="flex items-center justify-between">
              <button
                className="text-left font-medium"
                onClick={() => update({ landingPreset: l.value })}
              >
                {l.label}
              </button>
              {form.landingPreset === l.value && !isCustomLanding && (
                <Check className="size-4 text-primary" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
          </div>
        ))}
      </div>

      {/* Capture settings */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="mb-4 font-medium">Capture Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Capture Credentials</Label>
              <p className="text-xs text-muted-foreground">
                Log usernames entered on the phishing page
              </p>
            </div>
            <Switch
              checked={form.captureCredentials ?? true}
              onCheckedChange={(v) => update({ captureCredentials: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Capture Passwords</Label>
              <p className="text-xs text-muted-foreground">
                Log passwords submitted (stored hashed)
              </p>
            </div>
            <Switch
              checked={form.capturePasswords ?? false}
              onCheckedChange={(v) => update({ capturePasswords: v })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Post-Submission Redirect URL</Label>
        <Input
          placeholder="https://real-login.acme.com"
          value={form.redirectURL ?? ''}
          onChange={(e) => update({ redirectURL: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Where to redirect users after they submit data
        </p>
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        type="landing"
        initialHtml={editorHtml}
        onApply={(_subject, html) => {
          update({
            landingPreset: 'custom',
            ...(({ customLandingHTML: html }) as any),
          });
        }}
        onSave={(name, _subject, html) => {
          onSaveLanding(name, html);
          toast.success(`Landing page "${name}" saved`);
        }}
      />
    </div>
  );
}

// ─── Step 5: Review ──────────────────────────────────────────────────────────

function StepReview({
  form,
  recipients,
}: {
  form: CreateCampaignPayload;
  recipients: Recipient[];
}) {
  const templateLabel =
    form.templatePreset === 'custom'
      ? 'Custom Template'
      : EMAIL_PRESETS.find((t) => t.value === form.templatePreset)?.label ?? form.templatePreset;
  const landingLabel =
    form.landingPreset === 'custom'
      ? 'Custom Page'
      : LANDING_PRESETS.find((l) => l.value === form.landingPreset)?.label ?? form.landingPreset;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review Campaign</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify everything before creating.
        </p>
      </div>

      <div className="divide-y rounded-lg border bg-card">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Campaign Name
            </span>
            <p className="mt-1 font-medium">{form.name}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Target Domain
            </span>
            <p className="mt-1 font-medium">{form.target}</p>
          </div>
        </div>

        <div className="p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recipients
          </span>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="outline" className="text-base font-semibold">
              {recipients.length}
            </Badge>
            <span className="text-sm text-muted-foreground">
              target employee{recipients.length !== 1 ? 's' : ''}
            </span>
          </div>
          {recipients.length > 0 && recipients.length <= 10 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipients.map((r) => (
                <Badge key={r.email} variant="secondary" className="text-xs font-normal">
                  {r.email}
                </Badge>
              ))}
            </div>
          )}
          {recipients.length > 10 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipients.slice(0, 5).map((r) => (
                <Badge key={r.email} variant="secondary" className="text-xs font-normal">
                  {r.email}
                </Badge>
              ))}
              <Badge variant="secondary" className="text-xs font-normal">
                +{recipients.length - 5} more
              </Badge>
            </div>
          )}
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email Template
            </span>
            <p className="mt-1 font-medium">{templateLabel}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Landing Page
            </span>
            <p className="mt-1 font-medium">{landingLabel}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Duration
            </span>
            <p className="mt-1 font-medium">
              {(form.durationMinutes ?? 60) >= 60
                ? `${Math.floor((form.durationMinutes ?? 60) / 60)}h`
                : `${form.durationMinutes}m`}
            </p>
          </div>
        </div>

        <div className="flex gap-6 p-5">
          <div className="flex items-center gap-2">
            <div className={cn('size-2 rounded-full', form.captureCredentials ? 'bg-green-500' : 'bg-gray-300')} />
            <span className="text-sm">Capture Credentials</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('size-2 rounded-full', form.capturePasswords ? 'bg-green-500' : 'bg-gray-300')} />
            <span className="text-sm">Capture Passwords</span>
          </div>
        </div>
      </div>

      {/* Preview custom template */}
      {form.customHTML && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Email Preview</h3>
          <TemplatePreview html={form.customHTML} className="h-64" />
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function CreateCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
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

  const update = (patch: Partial<CreateCampaignPayload>) =>
    setForm((f) => ({ ...f, ...patch }));

  // Fetch saved templates
  const { data: savedEmailTemplates = [] } = useQuery({
    queryKey: ['phishing-templates', 'email'],
    queryFn: () => getPhishingTemplates('email'),
  });

  const { data: savedLandingTemplates = [] } = useQuery({
    queryKey: ['phishing-templates', 'landing'],
    queryFn: () => getPhishingTemplates('landing'),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: savePhishingTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phishing-templates'] });
    },
  });

  const mutation = useMutation({
    mutationFn: createPhishingCampaign,
    onSuccess: (campaign) => {
      toast.success('Campaign created successfully');
      navigate({
        to: '/phishing/$campaignId',
        params: { campaignId: campaign.id },
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create campaign');
    },
  });

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!form.name.trim() && !!form.target.trim();
      case 1:
        return recipients.length > 0;
      case 2:
        if (form.templatePreset === 'custom') return !!form.customHTML?.trim();
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

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
      <div className="mx-auto max-w-5xl">
        {/* Step indicator */}
        <nav className="mb-8">
          <ol className="flex items-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <li key={s.id} className="flex flex-1 items-center">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive && 'bg-primary text-primary-foreground font-medium',
                      isDone && 'text-primary cursor-pointer hover:bg-muted',
                      !isActive && !isDone && 'text-muted-foreground cursor-default',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                        isActive && 'bg-primary-foreground/20',
                        isDone && 'bg-primary/10',
                        !isActive && !isDone && 'bg-muted',
                      )}
                    >
                      {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn('mx-1 h-px flex-1', i < step ? 'bg-primary' : 'bg-border')} />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content */}
        <div className="min-h-[400px]">
          {step === 0 && <StepDetails form={form} update={update} />}
          {step === 1 && <StepRecipients recipients={recipients} setRecipients={setRecipients} />}
          {step === 2 && (
            <StepEmailTemplate
              form={form}
              update={update}
              savedTemplates={savedEmailTemplates}
              onSaveTemplate={(name, subject, html) =>
                saveTemplateMutation.mutate({
                  name,
                  type: 'email',
                  subject,
                  html,
                  description: `Cloned from editor`,
                })
              }
            />
          )}
          {step === 3 && (
            <StepLanding
              form={form}
              update={update}
              savedLandingPages={savedLandingTemplates}
              onSaveLanding={(name, html) =>
                saveTemplateMutation.mutate({
                  name,
                  type: 'landing',
                  html,
                  description: 'Custom landing page',
                })
              }
            />
          )}
          {step === 4 && <StepReview form={form} recipients={recipients} />}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <div>
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Link to="/phishing">
                <Button variant="outline">Cancel</Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="gap-2"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() =>
                  mutation.mutate({ ...form, recipients: recipientsToPayload(recipients) })
                }
                disabled={mutation.isPending || !canNext()}
                className="gap-2"
              >
                {mutation.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
