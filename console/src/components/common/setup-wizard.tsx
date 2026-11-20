import {
  CheckCircle2, ChevronRight, Download, Globe,
  Loader2, Package, Settings, Sparkles, Target, XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import AppLogo from '@/components/ui/app-logo';
import LogoFrame from '@/components/ui/logo-frame';
import ToolLogo from '@/components/ui/tool-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ToolConnectorConfigSheet } from '@/components/tools/tool-connector-config-sheet';
import { useWorkspaceState } from '@/hooks/useWorkspaceSelector';
import {
  useToolsControllerGetManyTools,
  useToolsControllerInstallTool,
  useTargetsControllerCreateMultipleTargets,
  TargetType,
  ToolsControllerGetManyToolsType,
  type Tool,
} from '@/services/apis/gen/queries';
import './setup-wizard.css';

const STORAGE_KEY = 'mithril_setup_v1';

type Step = 'welcome' | 'select' | 'install' | 'configure' | 'target' | 'done';
type InstallState = 'pending' | 'installing' | 'done' | 'error';

const STEP_ORDER: Step[] = ['welcome', 'select', 'install', 'configure', 'target', 'done'];

interface StepMeta { id: Step; title: string; desc: string; Icon: typeof Package; }

const STEP_META: StepMeta[] = [
  { id: 'welcome',   title: 'Welcome',      desc: 'Start here',                 Icon: Sparkles },
  { id: 'select',    title: 'Select Tools', desc: 'Choose your security stack', Icon: Package },
  { id: 'install',   title: 'Install',      desc: 'Install selected tools',     Icon: Download },
  { id: 'configure', title: 'Configure',    desc: 'Set up tool settings',       Icon: Settings },
  { id: 'target',    title: 'Add Target',   desc: 'Add your first target',      Icon: Target },
  { id: 'done',      title: 'All Set',      desc: 'Your workspace is ready',    Icon: CheckCircle2 },
];

const CATEGORY_LABELS: Record<string, string> = {
  subdomains:      'Subdomain',
  http_probe:      'HTTP Probe',
  ports_scanner:   'Port Scanner',
  vulnerabilities: 'Vuln Scanner',
  screenshot:      'Screenshot',
  url_discovery:   'URL Discovery',
};

export function SetupWizard() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (!localStorage.getItem(STORAGE_KEY)) setVisible(true); }, []);
  if (!visible) return null;
  return <SetupWizardInner onDone={() => setVisible(false)} />;
}

function SetupWizardInner({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const { state: { selectedWorkspaceId } } = useWorkspaceState();

  const [step, setStep]               = useState<Step>('welcome');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [installStatus, setInstallStatus] = useState<Record<string, InstallState>>({});
  const [configTool, setConfigTool]   = useState<Tool | null>(null);
  const [configuredIds, setConfiguredIds] = useState<Set<string>>(new Set());
  const [targetValue, setTargetValue] = useState('');
  const [targetType, setTargetType]   = useState<'DOMAIN' | 'IP' | 'CIDR'>('DOMAIN');

  const installStartedRef = useRef(false);
  const stepIndex = STEP_ORDER.indexOf(step);

  const toolsQuery = useToolsControllerGetManyTools(
    { type: ToolsControllerGetManyToolsType.connector, limit: 100 },
    { query: { enabled: Boolean(selectedWorkspaceId) } },
  );
  const tools: Tool[] = toolsQuery.data?.data ?? [];

  const installMutation = useToolsControllerInstallTool();
  const targetMutation  = useTargetsControllerCreateMultipleTargets();

  const selectedTools = tools.filter(t => selectedIds.has(t.id));
  const doneCount = Object.values(installStatus).filter(s => s === 'done' || s === 'error').length;
  const allSettled = selectedTools.length > 0 && doneCount === selectedTools.length;

  useEffect(() => {
    if (step !== 'install') return;
    if (installStartedRef.current) return;
    if (selectedIds.size === 0) { setStep('configure'); return; }
    installStartedRef.current = true;

    const run = async () => {
      const toolIds = Array.from(selectedIds);
      const init: Record<string, InstallState> = {};
      toolIds.forEach(id => { init[id] = 'pending'; });
      setInstallStatus(init);
      for (const toolId of toolIds) {
        setInstallStatus(prev => ({ ...prev, [toolId]: 'installing' }));
        try {
          await installMutation.mutateAsync({ data: { toolId } });
          setInstallStatus(prev => ({ ...prev, [toolId]: 'done' }));
        } catch {
          setInstallStatus(prev => ({ ...prev, [toolId]: 'error' }));
        }
        await new Promise(r => setTimeout(r, 250));
      }
    };
    void run();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    window.dispatchEvent(new CustomEvent('mithril-setup-done'));
    onDone();
    void navigate({ to: '/' });
  }, [navigate, onDone]);

  const goNext = () => {
    switch (step) {
      case 'welcome':   setStep('select'); break;
      case 'select':
        if (selectedIds.size === 0) setStep('target');
        else setStep('install');
        break;
      case 'install':   setStep('configure'); break;
      case 'configure': setStep('target'); break;
      case 'target':
        if (targetValue.trim()) {
          targetMutation.mutate(
            { data: { targets: [{ value: targetValue.trim(), type: TargetType[targetType] }] } },
            { onSuccess: () => setStep('done'), onError: () => setStep('done') },
          );
        } else { setStep('done'); }
        break;
      case 'done': complete(); break;
    }
  };

  const goBack = () => {
    if (step === 'install') { installStartedRef.current = false; setInstallStatus({}); }
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const toggleTool = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const doneInstalled = selectedTools.filter(t => installStatus[t.id] === 'done').length;

  const nextLabel = {
    welcome:   'Get Started',
    select:    selectedIds.size === 0 ? 'Skip Tools' : `Install ${selectedIds.size} Tool${selectedIds.size > 1 ? 's' : ''}`,
    install:   'Continue',
    configure: 'Continue',
    target:    targetValue.trim() ? 'Add Target' : 'Skip',
    done:      'Open Dashboard',
}[step];

  const nextDisabled = (step === 'install' && !allSettled) || targetMutation.isPending;
  const canGoBack    = step !== 'welcome' && step !== 'install' && step !== 'done';

  return (
    <div className="sw-overlay">
      <div className="sw-dialog">

        {/* Sidebar */}
        <aside className="sw-sidebar">
          <div className="sw-sidebar-logo"><AppLogo type="small" /></div>
          <nav className="sw-step-list">
            {STEP_META.map((s, i) => {
              const Icon = s.Icon;
              const isDone   = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={s.id} className={cn('sw-step', isActive && 'sw-step--active', isDone && 'sw-step--done')}>
                  <div className="sw-step-track">
                    <div className="sw-step-icon">
                      {isDone ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
                    </div>
                    {i < STEP_META.length - 1 && <div className="sw-step-connector" />}
                  </div>
                  <div className="sw-step-text">
                    <div className="sw-step-title">{s.title}</div>
                    <div className="sw-step-desc">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="sw-main">
          <div className="sw-body">

            {step === 'welcome' && (
              <div className="sw-step-content">
                <div className="sw-welcome-icon"><Sparkles className="size-9 text-primary" /></div>
                <h1 className="sw-heading">Welcome to Mithril</h1>
                <p className="sw-subheading">Let us help you set up your security workspace in a few simple steps.</p>
                <div className="sw-features">
                  {[
                    { Icon: Package,      label: 'Install security tools' },
                    { Icon: Globe,        label: 'Add targets to scan' },
                    { Icon: Sparkles,     label: 'AI-powered analysis' },
                    { Icon: CheckCircle2, label: 'Track vulnerabilities' },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="sw-feature-pill">
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'select' && (
              <div className="sw-step-content">
                <h2 className="sw-heading">Select Security Tools</h2>
                <p className="sw-subheading">Choose the tools to install. You can add more from the Tools page at any time.</p>
                {toolsQuery.isLoading ? (
                  <div className="sw-loading"><Loader2 className="size-6 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <div className="sw-select-bar">
                      <span className="sw-select-count">{selectedIds.size} selected</span>
                      <button className="sw-link" onClick={() => setSelectedIds(new Set(tools.map(t => t.id)))}>Select all</button>
                      {selectedIds.size > 0 && <button className="sw-link" onClick={() => setSelectedIds(new Set())}>Clear</button>}
                    </div>
                    <div className="sw-tool-grid">
                      {tools.map(tool => {
                        const sel  = selectedIds.has(tool.id);
                        const cats = tool.categories.map(c => CATEGORY_LABELS[c.name] ?? c.name);
                        return (
                          <button key={tool.id} className={cn('sw-tool-card', sel && 'sw-tool-card--selected')} onClick={() => toggleTool(tool.id)}>
                            <div className="sw-card-top">
                              <LogoFrame className="sw-card-logo"><ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={28} /></LogoFrame>
                              <div className={cn('sw-card-check', sel && 'sw-card-check--on')}>{sel && <CheckCircle2 className="size-3" />}</div>
                            </div>
                            <div className="sw-tool-name">{tool.name}</div>
                            <div className="sw-tool-cats">{cats.slice(0,2).map(c => <span key={c} className="sw-cat-chip">{c}</span>)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 'install' && (
              <div className="sw-step-content">
                <h2 className="sw-heading">Installing Tools</h2>
                <p className="sw-subheading">Installing {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} into your workspace.</p>
                <div className="sw-install-list">
                  {selectedTools.map(tool => {
                    const st = installStatus[tool.id] ?? 'pending';
                    return (
                      <div key={tool.id} className="sw-row">
                        <LogoFrame className="sw-row-logo"><ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={26} /></LogoFrame>
                        <span className="sw-row-name">{tool.name}</span>
                        <span className={cn('sw-badge', `sw-badge--${st}`)}>
                          {st === 'pending'    && 'Waiting'}
                          {st === 'installing' && <><Loader2 className="size-3 animate-spin" /> Installing</>}
                          {st === 'done'       && <><CheckCircle2 className="size-3" /> Done</>}
                          {st === 'error'      && <><XCircle className="size-3" /> Failed</>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {allSettled && <p className="sw-install-note"><CheckCircle2 className="size-4" /> All done — click Continue to configure your tools.</p>}
              </div>
            )}

            {step === 'configure' && (
              <div className="sw-step-content">
                <h2 className="sw-heading">Configure Tools</h2>
                <p className="sw-subheading">Set up authentication or settings for each tool. You can skip any and configure later from the Tools page.</p>
                {selectedTools.filter(t => installStatus[t.id] === 'done').length === 0 ? (
                  <p className="sw-subheading">No tools were installed. You can install tools later from the Tools page.</p>
                ) : (
                  <div className="sw-config-list">
                    {selectedTools.filter(t => installStatus[t.id] === 'done').map(tool => {
                      const configured = configuredIds.has(tool.id);
                      return (
                        <div key={tool.id} className="sw-row">
                          <LogoFrame className="sw-row-logo"><ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={26} /></LogoFrame>
                          <span className="sw-row-name">{tool.name}</span>
                          {configured ? (
                            <span className="sw-badge sw-badge--done"><CheckCircle2 className="size-3" /> Configured</span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setConfigTool(tool)}>
                              <Settings className="size-3" /> Configure
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 'target' && (
              <div className="sw-step-content">
                <h2 className="sw-heading">Add Your First Target</h2>
                <p className="sw-subheading">Enter the domain, IP, or CIDR range you want to scan. You can skip this and add targets later.</p>
                <div className="sw-target-form">
                  <div className="sw-type-row">
                    {(['DOMAIN', 'IP', 'CIDR'] as const).map(t => (
                      <button key={t} className={cn('sw-type-btn', targetType === t && 'sw-type-btn--on')} onClick={() => setTargetType(t)}>{t}</button>
                    ))}
                  </div>
                  <Input
                    placeholder={targetType === 'DOMAIN' ? 'example.com' : targetType === 'IP' ? '192.168.1.1' : '10.0.0.0/24'}
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && targetValue.trim()) goNext(); }}
                    autoFocus
                  />
                  <p className="sw-target-hint">
                    {targetType === 'DOMAIN' && 'Enter a root domain. Mithril will discover subdomains and assets automatically.'}
                    {targetType === 'IP'     && 'Enter a single IP address.'}
                    {targetType === 'CIDR'   && 'Enter a CIDR range (/24 to /32).'}
                  </p>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="sw-step-content sw-done-wrap">
                <div className="sw-done-ring"><CheckCircle2 className="size-10 text-green-400" /></div>
                <h2 className="sw-heading">You are all set!</h2>
                <p className="sw-subheading" style={{ textAlign: 'center' }}>Your workspace is ready. Head to the dashboard to start exploring.</p>
                <div className="sw-done-items">
                  {doneInstalled > 0 && (
                    <div className="sw-done-row"><CheckCircle2 className="size-4 text-green-400" /><span>{doneInstalled} tool{doneInstalled !== 1 ? 's' : ''} installed</span></div>
                  )}
                  {targetValue.trim() && (
                    <div className="sw-done-row"><CheckCircle2 className="size-4 text-green-400" /><span>Target added: {targetValue}</span></div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="sw-footer">
            <Button variant="ghost" onClick={goBack} disabled={!canGoBack}>Back</Button>
            <div className="sw-footer-right">
              {(step === 'configure' || step === 'target') && (
                <Button variant="ghost" onClick={goNext}>Skip</Button>
              )}
              <Button onClick={goNext} disabled={nextDisabled}>
                {targetMutation.isPending
                  ? <><Loader2 className="size-4 animate-spin" /> Adding...</>
                  : <>{nextLabel}{step !== 'done' && <ChevronRight className="size-4" />}</>
                }
              </Button>
            </div>
          </div>
        </main>
      </div>

      {configTool && (
        <ToolConnectorConfigSheet
          open={Boolean(configTool)}
          onOpenChange={open => { if (!open) setConfigTool(null); }}
          tool={configTool}
          onSuccess={() => {
            setConfiguredIds(prev => new Set([...prev, configTool!.id]));
            setConfigTool(null);
          }}
        />
      )}
    </div>
  );
}
