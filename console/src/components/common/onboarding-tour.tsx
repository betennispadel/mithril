import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './onboarding-tour.css';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

const STORAGE_KEY = 'mithril_tour_v1';

// Steps: [path to navigate before showing, element selector (null = centered), title, description]
const STEPS: [string | null, string | null, string, string][] = [
  [
    null,
    null,
    'Welcome to Mithril',
    'Mithril is an attack surface management and security scanning platform. This quick tour will walk you through the key sections.',
  ],
  [
    '/tools',
    null,
    'Tools',
    'Start here. Install security scanners — Nuclei, Nmap, ZAP, WPScan and more — into your workspace. Each tool runs as an isolated container.',
  ],
  [
    '/targets',
    null,
    'Targets',
    'Add the domains, IP addresses or CIDR ranges you want to scan. Mithril will discover subdomains and services automatically after a scan.',
  ],
  [
    '/assets',
    null,
    'Assets',
    'Discovered subdomains, open ports and running services appear here. Each asset can be scanned individually or as part of a project.',
  ],
  [
    '/vulnerabilities',
    null,
    'Vulnerabilities',
    'All findings from your scans are collected here, organized by severity. Assign issues, track remediation and generate reports.',
  ],
  [
    '/projects',
    null,
    'Projects',
    'Projects let you combine targets, a tool pipeline and a schedule into one automated workflow. Run once or on a cron schedule.',
  ],
  [
    '/aistudio',
    null,
    'AI Studio',
    'Chat with AI to analyze findings, trigger scans, explain vulnerabilities and get fix recommendations — all in natural language.',
  ],
  [
    '/',
    null,
    "You're all set!",
    'Start by adding a target and installing a tool, then run your first scan. Good hunting.',
  ],
];

export function OnboardingTour({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const launch = () => {
      if (localStorage.getItem(STORAGE_KEY)) return;

      // eslint-disable-next-line prefer-const
      let d: ReturnType<typeof driver>;

      const goTo = (path: string, delay = 500) => {
        void navigate({ to: path as '/' });
        setTimeout(() => d.moveNext(), delay);
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
          if (next && next[0]) {
            goTo(next[0]);
          } else {
            d.moveNext();
          }
        },
        onPrevClick: (_el, _step, { state }) => {
          const idx = state.activeIndex ?? 0;
          const prev = STEPS[idx - 1];
          if (prev && prev[0]) {
            void navigate({ to: prev[0] as '/' });
            setTimeout(() => d.movePrevious(), 500);
          } else {
            d.movePrevious();
          }
        },
        steps: STEPS.map(([, el, title, description]) => ({
          ...(el ? { element: el } : {}),
          popover: { title, description, side: el ? ('right' as const) : undefined, align: el ? ('start' as const) : undefined },
        })),
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, '1');
        },
      });

      d.drive();
    };

    if (!localStorage.getItem('mithril_setup_v1')) {
      const handler = () => setTimeout(launch, 600);
      window.addEventListener('mithril-setup-done', handler, { once: true });
      return () => window.removeEventListener('mithril-setup-done', handler);
    }

    const timer = setTimeout(launch, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
