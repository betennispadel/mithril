import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect } from 'react';

const STORAGE_KEY = 'mithril_tour_v1';

export function OnboardingTour() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.35,
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Get started',
      steps: [
        {
          popover: {
            title: 'Welcome to Mithril',
            description:
              'Mithril is an attack surface management and security scanning platform. Let's take a quick tour.',
          },
        },
        {
          element: 'a[href=/targets]',
          popover: {
            title: 'Targets',
            description:
              'Add the domains, IPs or organisations you want to scan. Everything starts with a target.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: 'a[href=/assets]',
          popover: {
            title: 'Assets',
            description:
              'After discovery, subdomains, services and open ports are automatically listed here.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: 'a[href=/vulnerabilities]',
          popover: {
            title: 'Vulnerabilities',
            description:
              'All scan findings land here. Filter by severity, assign issues and track remediation.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: 'a[href=/tools]',
          popover: {
            title: 'Tools',
            description:
              'Install and configure security tools — Nuclei, ZAP, Nmap, WPScan and more — from this page.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: 'a[href=/aistudio]',
          popover: {
            title: 'AI Studio',
            description:
              'AI-powered security analysis. Explain findings, trigger scans automatically, and get fix recommendations.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: 'a[href=/reports]',
          popover: {
            title: 'Reports',
            description:
              'Generate and share professional security reports from your scan results.',
            side: 'right',
            align: 'start',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(STORAGE_KEY, '1');
      },
    });

    const timer = setTimeout(() => driverObj.drive(), 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
