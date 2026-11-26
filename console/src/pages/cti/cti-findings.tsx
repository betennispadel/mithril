import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { CtiFindingsView } from '@/pages/cti/cti-findings-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  Eye, Lock, Shield, Radio, Fingerprint, AlertTriangle, ScanSearch, LayoutList
} from 'lucide-react';

const CATEGORIES = [
  { key: '',              label: 'All',      icon: LayoutList,    description: 'All threat intelligence findings' },
  { key: 'darkweb',      label: 'Dark Web',  icon: Eye,           description: 'Dark web forums, ransomware leak sites and underground markets' },
  { key: 'data-leak',    label: 'Data Leaks', icon: Lock,         description: 'Leaked credentials, exposed databases and breached data' },
  { key: 'brand',        label: 'Brand',     icon: Shield,        description: 'Brand impersonation, typosquatting and trademark abuse' },
  { key: 'ioc',          label: 'IOC Feed',  icon: Radio,         description: 'Indicators of compromise from threat intelligence feeds' },
  { key: 'fraud',        label: 'Fraud',     icon: Fingerprint,   description: 'Fraud schemes, carding and financial crime intelligence' },
  { key: 'sanctions',    label: 'Sanctions', icon: AlertTriangle, description: 'Sanctioned entities, OFAC and regulatory watchlists' },
  { key: 'phishing',     label: 'Phishing',  icon: ScanSearch,    description: 'Phishing domains, typosquats and domain impersonation' },
];

export default function CtiFindingsPage() {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  const navigate = useNavigate();

  // Read category from URL search params
  const search = useSearch({ strict: false }) as { category?: string };
  const activeCategory = search.category ?? '';

  const active = CATEGORIES.find(c => c.key === activeCategory) ?? CATEGORIES[0];

  const setCategory = (key: string) => {
    navigate({
      to: '/cti/findings',
      search: key ? { category: key } : {},
    });
  };

  return (
    <Page
      title="Findings"
      description={active.description}
      permission="vulnerability.read"
    >
      {!hasWorkspace ? (
        <CreateWorkspace />
      ) : (
        <div className="space-y-4">
          {/* Category tab bar */}
          <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  activeCategory === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Findings table */}
          <CtiFindingsView category={activeCategory || undefined} />
        </div>
      )}
    </Page>
  );
}
