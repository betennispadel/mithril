import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './onboarding-tour.css';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

const STORAGE_KEY = 'mithril_tour_v1';

interface TourStep {
  navigateTo: string | null;
  selector: string | null;
  title: string;
  description: string;
  side?: 'right' | 'left' | 'top' | 'bottom';
}

const STEPS: TourStep[] = [
  /* 0 - Welcome */
  {
    navigateTo: null,
    selector: null,
    title: 'Welcome to Mithril',
    description:
      'Mithril is an enterprise attack surface management platform. ' +
      'This tour walks you through every section step by step -- it only takes a couple of minutes.',
  },

  /* ===== TOOLS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/tools"]',
    title: 'Tools -- the starting point',
    description:
      'Everything in Mithril starts here. Click Tools in the sidebar to open the marketplace. ' +
      'You must install at least one scanner before you can run a scan.',
    side: 'right',
  },
  {
    navigateTo: '/tools',
    selector: '[data-tour="tools-tabs"]',
    title: 'Tool types',
    description:
      'Four tabs: ' +
      '<b>All</b> shows the full catalog. ' +
      '<b>Built-in</b> are tools that run directly on your worker (Nmap, FFuf, Subfinder, etc.). ' +
      '<b>Connector</b> are Docker-packaged scanners (Nuclei, WPScan, Semgrep, ZAP) -- richer but need Docker. ' +
      '<b>Installed</b> shows only tools already in your workspace.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tools-search"]',
    title: 'Search and category filter',
    description:
      'Type a tool name or keyword to search. Use the <b>category dropdown</b> on the right to filter by type: ' +
      'Recon, SAST, Fuzzing, Web Scanner, Network, and more. ' +
      'Combining both narrows the list quickly when you know what you need.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tools-grid"]',
    title: 'Tool cards',
    description:
      'Each card shows the tool name, a short description, category badges, and an <b>Install</b> button. ' +
      'Click anywhere on a card (except the button) to open the detail page -- that has docs, example commands and a configuration tab. ' +
      'Connectors show a <b>Config</b> button after install to create a configuration profile.',
    side: 'top',
  },

  /* ===== TARGETS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/targets"]',
    title: 'Targets',
    description:
      'A Target is anything you want to scan: a domain, an IP address, a CIDR range, or a Git repository. ' +
      'Once added, Mithril continuously discovers what is attached to it.',
    side: 'right',
  },
  {
    navigateTo: '/targets',
    selector: '[data-tour="target-summary"]',
    title: 'Summary cards',
    description:
      'At a glance: total targets in your workspace, how many are <b>Scanning</b> right now, ' +
      'how many have an <b>open critical</b> vulnerability, and how many are <b>Stale</b> (no scan in 30+ days). ' +
      'Click any card to filter the list to that view.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="add-target"]',
    title: 'Start Discovery -- add your first target',
    description:
      'Click this button to open the target wizard. ' +
      'Supported types: <b>Domain</b> (example.com), <b>IP</b> (1.2.3.4), <b>CIDR</b> (10.0.0.0/24), ' +
      'or a <b>Git repository URL</b> for SAST scanning. ' +
      'After you save, Mithril kicks off a discovery job and starts populating Assets automatically.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="target-list"]',
    title: 'Target table',
    description:
      'Each row shows: target name and type icon, source integration (if synced from GitHub/GitLab/Jira), ' +
      'a colour-coded <b>severity bar</b> of open findings, current scan status badge, schedule, and linked projects. ' +
      'Use the <b>Type</b>, <b>Scan status</b> and <b>Scope</b> dropdowns above the table to filter. ' +
      'Click any row to open the target detail page (Overview, Assets, Vulnerabilities, Jobs tabs).',
    side: 'top',
  },

  /* ===== ASSETS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/assets"]',
    title: 'Assets -- the discovered attack surface',
    description:
      'After a scan runs, everything Mithril finds -- subdomains, open ports, running services, ' +
      'live URLs, detected technologies and TLS certificates -- appears here as Assets.',
    side: 'right',
  },
  {
    navigateTo: '/assets',
    selector: '[data-tour="assets-tabs"]',
    title: 'Asset categories',
    description:
      '<b>Services</b>: HTTP/HTTPS endpoints with status codes and titles. ' +
      '<b>Hosts</b>: resolved hostnames. ' +
      '<b>Ports</b>: open TCP/UDP ports per host. ' +
      '<b>IPs</b>: observed IP addresses. ' +
      '<b>URLs</b>: crawled paths. ' +
      '<b>Technologies</b>: detected frameworks, CMS and libraries. ' +
      '<b>TLS</b>: certificate details and expiry. ' +
      'Click any row to open the asset detail sheet with full scan history and linked vulnerabilities.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="assets-filter"]',
    title: 'Asset filter bar',
    description:
      'Filter the current asset view by tags, source target, severity, discovery method and custom fields. ' +
      'Filters are combinable -- useful for narrowing down a large attack surface to what matters most.',
    side: 'bottom',
  },

  /* ===== VULNERABILITIES ===== */
  {
    navigateTo: null,
    selector: 'a[href="/vulnerabilities"]',
    title: 'Vulnerabilities -- your findings inbox',
    description:
      'All findings from every scan land here, ranked by severity: Critical, High, Medium, Low, Info. ' +
      'This is your main triage and remediation workspace.',
    side: 'right',
  },
  {
    navigateTo: '/vulnerabilities',
    selector: '[data-tour="vuln-tabs"]',
    title: 'Triage workflow',
    description:
      '<b>Open</b>: new, unreviewed findings -- start here. ' +
      '<b>In Review</b>: assigned to a team member, work in progress. ' +
      '<b>Fixed</b>: patched and verified -- Mithril auto-closes these if the fingerprint is not seen again after the next scan. ' +
      '<b>Dismissed</b>: false positives or accepted risks. ' +
      'The count badge on each tab updates in real time as scans complete.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="vuln-fastscan"]',
    title: 'Fast Scan',
    description:
      'Kick off an instant scan on any target without building a full project. ' +
      'Pick a target, choose a tool and hit Run -- results appear in Vulnerabilities within minutes. ' +
      'Ideal for quick re-verification after patching a finding.',
    side: 'bottom',
  },

  /* ===== PROJECTS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/projects"]',
    title: 'Projects -- automated scan pipelines',
    description:
      'Projects combine targets, a tool pipeline and a schedule into one automated workflow. ' +
      'Set it once, run it forever.',
    side: 'right',
  },
  {
    navigateTo: '/projects',
    selector: '[data-tour="projects-grid"]',
    title: 'Projects grid',
    description:
      'Each card shows the project name, the tool pipeline icons in order, next scheduled run time, ' +
      'total asset count and a severity bar of its latest findings. ' +
      'Click a card to open the project detail page: Overview (timeline, charts), Assets, Jobs (run history) and Settings.',
    side: 'top',
  },
  {
    navigateTo: null,
    selector: '[data-tour="create-project"]',
    title: 'Create a project',
    description:
      'Click Create to open the project wizard: ' +
      '1. Name your project and select targets. ' +
      '2. Build the tool pipeline -- drag tools into order (e.g. Nmap first, then Nuclei). ' +
      '3. Set a cron schedule (daily, weekly, or custom). ' +
      '4. Optionally add scope rules to include or exclude specific asset patterns. ' +
      'Mithril runs the pipeline automatically and merges new findings into Vulnerabilities.',
    side: 'bottom',
  },

  /* ===== AI STUDIO ===== */
  {
    navigateTo: null,
    selector: 'a[href="/aistudio"]',
    title: 'AI Studio',
    description:
      'AI Studio connects a language model directly to your workspace data -- targets, assets, vulnerabilities and job history. ' +
      'Use it for analysis, automation and reporting, all in natural language.',
    side: 'right',
  },
  {
    navigateTo: '/aistudio',
    selector: '[data-tour="aistudio-prompts"]',
    title: 'Prompt categories',
    description:
      'Click a topic chip to expand a list of example prompts for that category. ' +
      'Hover a prompt to preview it in the input field below. ' +
      'Click a prompt to fill it in and send, or customise it first. ' +
      'Categories include Recon, SAST, Vulnerability Analysis, Reporting and more.',
    side: 'top',
  },
  {
    navigateTo: null,
    selector: '[data-tour="aistudio-input"]',
    title: 'Chat input',
    description:
      'Type any natural-language command and press Enter (or click the send button). ' +
      'Examples: "What are my critical vulnerabilities on example.com?", ' +
      '"Run a Nuclei scan on the staging target", ' +
      '"Generate a summary report of last week's findings". ' +
      'Switch to <b>Agent mode</b> (toggle in the input) for autonomous multi-step operations where the AI plans and executes a sequence of actions.',
    side: 'top',
  },

  /* Done */
  {
    navigateTo: '/',
    selector: null,
    title: "You're all set!",
    description:
      'You have seen everything Mithril has to offer. ' +
      'Start by adding a target, installing a tool and running your first scan. ' +
      'Good hunting.',
  },
];

export function OnboardingTour() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(launch, 800);
    return () => clearTimeout(timer);

    function launch() {
      if (localStorage.getItem(STORAGE_KEY)) return;

      // eslint-disable-next-line prefer-const
      let d: ReturnType<typeof driver>;

      const goThen = (path: string, cb: () => void, delay = 700) => {
        void navigate({ to: path as '/' });
        setTimeout(cb, delay);
      };

      d = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        overlayOpacity: 0.5,
        popoverClass: 'mithril-tour',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        progressText: '{{current}} / {{total}}',

        onNextClick: (_el, _step, { state }) => {
          const idx = state.activeIndex ?? 0;
          const next = STEPS[idx + 1];
          if (!next) { d.moveNext(); return; }
          if (next.navigateTo) {
            goThen(next.navigateTo, () => d.moveNext());
          } else {
            d.moveNext();
          }
        },

        onPrevClick: (_el, _step, { state }) => {
          const idx = state.activeIndex ?? 0;
          const prev = STEPS[idx - 1];
          if (!prev) { d.movePrevious(); return; }
          if (prev.navigateTo) {
            goThen(prev.navigateTo, () => d.movePrevious());
          } else {
            d.movePrevious();
          }
        },

        steps: STEPS.map((s) => ({
          ...(s.selector ? { element: s.selector } : {}),
          popover: {
            title: s.title,
            description: s.description,
            ...(s.selector
              ? { side: s.side ?? 'right', align: 'start' }
              : {}),
          },
        })),

        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, '1');
        },
      });

      d.drive();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
