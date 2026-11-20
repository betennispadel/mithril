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
  {
    navigateTo: null,
    selector: null,
    title: 'Welcome to Mithril',
    description:
      'Mithril is an enterprise attack surface management platform. This tour walks you through the key sections in about a minute.',
  },
  {
    navigateTo: null,
    selector: 'a[href="/tools"]',
    title: 'Tools',
    description:
      'Everything starts with Tools. Click here to open the marketplace where you install security scanners into your workspace.',
    side: 'right',
  },
  {
    navigateTo: '/tools',
    selector: '[data-tour="tools-tabs"]',
    title: 'Tool Types',
    description:
      'Filter by All, Built-in, Connector or Installed. Built-in tools run on your worker. Connectors are Docker-packaged scanners like Semgrep, Nuclei and WPScan.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tools-search"]',
    title: 'Search and Filter',
    description:
      'Find tools by name or keyword. Use the category dropdown to narrow by type: recon, SAST, fuzzing, and more.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: 'a[href="/targets"]',
    title: 'Targets',
    description:
      'Once your tools are ready, add Targets. A target is any domain, IP range or repository you want to scan.',
    side: 'right',
  },
  {
    navigateTo: '/targets',
    selector: '[data-tour="add-target"]',
    title: 'Start Discovery',
    description:
      'Click here to add a new target. Enter a domain like example.com or a CIDR range. Mithril will automatically discover subdomains, open ports and running services.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="target-list"]',
    title: 'Target List',
    description:
      'All targets in your workspace appear here. The summary cards show totals, active scans and targets with critical findings. Click any row to drill in.',
    side: 'top',
  },
  {
    navigateTo: null,
    selector: 'a[href="/assets"]',
    title: 'Assets',
    description:
      'After a scan runs, everything Mithril discovers -- subdomains, hosts, open ports, URLs and technologies -- appears here as Assets.',
    side: 'right',
  },
  {
    navigateTo: '/assets',
    selector: '[data-tour="assets-tabs"]',
    title: 'Asset Categories',
    description:
      'Assets are grouped by type: Services, Hosts, Ports, IPs, URLs, Technologies and more. Use the tabs to explore each category.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: 'a[href="/vulnerabilities"]',
    title: 'Vulnerabilities',
    description:
      'All findings from your scans land here, organised by severity. This is your main triage workspace.',
    side: 'right',
  },
  {
    navigateTo: '/vulnerabilities',
    selector: '[data-tour="vuln-tabs"]',
    title: 'Triage Workflow',
    description:
      'Use the status tabs to manage findings. Move issues from Open to In Review once assigned, then to Fixed when patched. Dismiss false positives. Counts update in real time.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: 'a[href="/projects"]',
    title: 'Projects',
    description:
      'Projects automate everything. Combine targets, a tool pipeline and a cron schedule into one repeatable workflow.',
    side: 'right',
  },
  {
    navigateTo: '/projects',
    selector: '[data-tour="create-project"]',
    title: 'Create a Project',
    description:
      'Click Create to build a new project. Choose targets, pick a tool pipeline (for example Nmap then Nuclei), set a schedule and Mithril runs it automatically.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: 'a[href="/aistudio"]',
    title: 'AI Studio',
    description:
      'AI Studio connects a language model to your workspace data. Ask it to explain a vulnerability, trigger a scan or summarise your most critical findings.',
    side: 'right',
  },
  {
    navigateTo: '/aistudio',
    selector: '[data-tour="aistudio-input"]',
    title: 'Chat Interface',
    description:
      'Type a natural-language command here. Try "What are my critical vulnerabilities?" or "Run Nuclei on example.com". The AI has full visibility of your workspace.',
    side: 'top',
  },
  {
    navigateTo: '/',
    selector: null,
    title: "You're all set!",
    description:
      'Start by adding a target and installing a tool, then kick off your first scan. Good hunting.',
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

      const goThen = (path: string, cb: () => void, delay = 650) => {
        void navigate({ to: path as '/' });
        setTimeout(cb, delay);
      };

      d = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        overlayOpacity: 0.45,
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
