import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './onboarding-tour.css';
import { useEffect } from 'react';

const STORAGE_KEY = 'mithril_tour_v1';

function startTour() {
  if (localStorage.getItem(STORAGE_KEY)) return;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: false,
    overlayOpacity: 0.55,
    popoverClass: 'mithril-tour',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Get started',
    steps: [
      {
        popover: {
          title: 'Welcome to Mithril',
          description: 'Mithril is an attack surface management and security scanning platform. Take a quick tour.',
        },
      },
      {
        element: 'a[href="/targets"]',
        popover: {
          title: 'Targets',
          description: 'Add the domains, IPs or organisations you want to scan. Everything starts with a target.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'a[href="/assets"]',
        popover: {
          title: 'Assets',
          description: 'After discovery, subdomains, services and open ports are listed here automatically.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'a[href="/vulnerabilities"]',
        popover: {
          title: 'Vulnerabilities',
          description: 'All scan findings land here. Filter by severity and track remediation.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'a[href="/tools"]',
        popover: {
          title: 'Tools',
          description: 'Install and configure security tools such as Nuclei, ZAP and Nmap from this page.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'a[href="/aistudio"]',
        popover: {
          title: 'AI Studio',
          description: 'AI-powered security analysis. Explain findings, trigger scans and get fix recommendations.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'a[href="/reports"]',
        popover: {
          title: 'Reports',
          description: 'Generate and share professional security reports from your scan results.',
          side: 'right',
          align: 'start',
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem(STORAGE_KEY, '1');
    },
  });

  driverObj.drive();
}

export function OnboardingTour() {
  useEffect(() => {
    // Already toured
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Setup wizard not done yet — wait for it to fire the event
    if (!localStorage.getItem('mithril_setup_v1')) {
      const handler = () => setTimeout(startTour, 600);
      window.addEventListener('mithril-setup-done', handler, { once: true });
      return () => window.removeEventListener('mithril-setup-done', handler);
    }

    // Setup already done, start tour normally
    const timer = setTimeout(startTour, 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
