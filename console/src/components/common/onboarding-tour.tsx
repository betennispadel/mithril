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
      'This tour walks you through every section and every component step by step.',
  },

  /* ===== TOOLS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/tools"]',
    title: 'Tools -- install security scanners',
    description:
      'Everything starts here. Before you can run any scan you must install at least one tool. ' +
      'The marketplace has built-in tools and connector tools -- both explained on the next steps.',
    side: 'right',
  },
  {
    navigateTo: '/tools',
    selector: '[data-tour="tools-tabs"]',
    title: 'Tool types',
    description:
      '<b>All</b>: the full catalog of available tools.<br>' +
      '<b>Built-in</b>: lightweight tools that run directly on your worker process -- Nmap, FFuf, Subfinder, httpx, etc. No Docker needed, instant start.<br>' +
      '<b>Connector</b>: full-featured scanners packaged as Docker containers -- Nuclei, WPScan, Semgrep, OWASP ZAP, Trivy and more. Richer output, need Docker on the worker.<br>' +
      '<b>Installed</b>: only the tools already installed in your workspace.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tools-search"]',
    title: 'Search and category filter',
    description:
      'Type a tool name or keyword in the search box to find tools instantly. ' +
      'Use the <b>category dropdown</b> on the right to filter by type: ' +
      'Recon, Web Scanner, SAST (code analysis), Fuzzing, Network, Container Security, Secret Scanner and more. ' +
      'You can combine search text and category for precise filtering.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tool-install-btn"]',
    title: 'Installing a tool',
    description:
      'This Install button adds the tool to your workspace. Here is exactly what happens for each type:<br><br>' +
      '<b>Built-in tools</b> (Nmap, FFuf, etc.): click Install -- the tool is ready immediately. No configuration needed.<br><br>' +
      '<b>Connector tools</b> (Nuclei, WPScan, Semgrep, ZAP, etc.): after clicking Install, a <b>Configuration Profile</b> sheet slides in automatically. Inside that sheet:<br>' +
      '- <b>Profile name</b>: a label for this configuration set, e.g. "default", "web-recon", "api-scan". You can create multiple profiles with different settings.<br>' +
      '- <b>Use default presets</b>: click this button first -- it fills every field with the the tool recommended values and is a safe starting point.<br>' +
      '- <b>Tool-specific fields</b>: each connector defines its own schema. Common fields include: rate limit (requests per second), thread count, scan timeout, output verbosity, auth tokens for private repos, custom flags and target scope rules.<br>' +
      '- Click <b>Create</b> to save the profile. The tool is now installed and configured.',
    side: 'left',
  },
  {
    navigateTo: null,
    selector: '[data-tour="tools-grid"]',
    title: 'Tool cards and detail page',
    description:
      'Each card shows the tool logo, name, official badge (blue tick = officially supported), description, and category badges with compatible target types.<br><br>' +
      'Click the card body (not the Install button) to open the <b>Tool Detail page</b>:<br>' +
      '- <b>Overview tab</b>: full description, Docker image path, version, author, homepage and repository links.<br>' +
      '- <b>Configuration tab</b> (connectors only, visible after install): manage your configuration profiles here.<br>' +
      '  -- Create new profiles with different settings for different use cases.<br>' +
      '  -- <b>Set Default</b>: the default profile is used automatically when this tool runs in a project pipeline -- set your most-used profile as default.<br>' +
      '  -- Edit or delete existing profiles at any time.',
    side: 'top',
  },

  /* ===== TARGETS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/targets"]',
    title: 'Targets -- what you scan',
    description:
      'A Target is any asset you want to monitor and scan: a domain, an IP address, a CIDR range, or a Git repository. ' +
      'Once added, Mithril continuously discovers what is attached to it.',
    side: 'right',
  },
  {
    navigateTo: '/targets',
    selector: '[data-tour="target-summary"]',
    title: 'Summary cards',
    description:
      'At a glance across your workspace:<br>' +
      '- <b>Targets</b>: total count in this workspace. Click to show all.<br>' +
      '- <b>Scanning</b>: targets with an active scan job running right now.<br>' +
      '- <b>With critical</b>: targets that have at least one open Critical finding -- prioritise these.<br>' +
      '- <b>Stale</b>: targets not scanned in 30+ days -- schedule a rescan.<br>' +
      'Click any card to filter the target list to that view.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="add-target"]',
    title: 'Start Discovery -- add your first target',
    description:
      'Click this button to open the target creation wizard. Supported types:<br>' +
      '- <b>Domain</b> (e.g. example.com): Mithril auto-discovers subdomains, enumerates DNS, finds services and open ports.<br>' +
      '- <b>IP address</b> (e.g. 1.2.3.4): directly scans the host for open ports and services.<br>' +
      '- <b>CIDR range</b> (e.g. 10.0.0.0/24): sweeps an entire subnet, enumerates live hosts.<br>' +
      '- <b>Git repository URL</b>: used for SAST scanning with Semgrep or Trivy -- scans source code for vulnerabilities.<br>' +
      'After saving, Mithril triggers a discovery job and starts populating the Assets page automatically.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="target-list"]',
    title: 'Target table',
    description:
      'The main target list. Each row shows:<br>' +
      '- <b>Target name and type icon</b>: domain, IP, CIDR or git.<br>' +
      '- <b>Source integration icon</b>: if synced from GitHub, GitLab or Jira -- click to go to that integration.<br>' +
      '- <b>Severity bar</b>: colour-coded bar of open findings (Critical / High / Medium / Low / Info).<br>' +
      '- <b>Scan status badge</b>: Idle, Running, Completed, Failed.<br>' +
      '- <b>Schedule</b>: next run time if a cron schedule is set.<br>' +
      '- <b>Projects</b>: coloured dots showing which projects include this target.<br><br>' +
      'Filter controls above the table: <b>Type</b> (domain/IP/CIDR/git), <b>Scan status</b>, <b>Scope</b> (in/out of scope).<br>' +
      'Click any row to open the target detail page with Overview, Assets, Vulnerabilities and Jobs tabs.',
    side: 'top',
  },

  /* ===== ASSETS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/assets"]',
    title: 'Assets -- the discovered attack surface',
    description:
      'After a scan runs, everything Mithril discovers -- subdomains, open ports, services, URLs, technologies, TLS certificates -- appears here. ' +
      'This is your full external attack surface.',
    side: 'right',
  },
  {
    navigateTo: '/assets',
    selector: '[data-tour="assets-tabs"]',
    title: 'Asset categories',
    description:
      'Assets are split into 8 categories, each with its own table:<br>' +
      '- <b>Services</b>: HTTP/HTTPS endpoints -- status code, response title, screenshot preview.<br>' +
      '- <b>Hosts</b>: resolved hostnames with their linked IPs.<br>' +
      '- <b>Ports</b>: open TCP/UDP ports per host, with banner and service detection.<br>' +
      '- <b>IPs</b>: observed IP addresses with reverse DNS and ASN info.<br>' +
      '- <b>URLs</b>: crawled paths and endpoints, great for finding hidden admin panels.<br>' +
      '- <b>Technologies</b>: detected frameworks, CMS, libraries and their versions.<br>' +
      '- <b>TLS</b>: certificate details, issuer, expiry date and cipher info.<br>' +
      '- <b>Status Code</b>: grouped view of endpoints by HTTP response code.<br>' +
      'Click any row to open the asset detail sheet with full scan history, tags and linked vulnerabilities.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="assets-filter"]',
    title: 'Asset filter bar',
    description:
      'Filter assets by multiple criteria at once: by tag (custom labels you apply), by source target, by severity of linked findings, by discovery method (passive/active), and by custom field values. ' +
      'Filters are combinable -- e.g. "Services with critical findings on domain example.com" narrows a large attack surface to exactly what needs attention today.',
    side: 'bottom',
  },

  /* ===== VULNERABILITIES ===== */
  {
    navigateTo: null,
    selector: 'a[href="/vulnerabilities"]',
    title: 'Vulnerabilities -- your findings inbox',
    description:
      'All findings from every tool across every target land here. ' +
      'Findings are ranked by severity: Critical, High, Medium, Low, Info. ' +
      'This is your main triage and remediation workspace.',
    side: 'right',
  },
  {
    navigateTo: '/vulnerabilities',
    selector: '[data-tour="vuln-tabs"]',
    title: 'Triage workflow -- status tabs',
    description:
      'Vulnerabilities move through a lifecycle with these status tabs:<br>' +
      '- <b>Open</b>: new, unreviewed findings -- start your triage here. The count shows how many need attention.<br>' +
      '- <b>In Review</b>: assigned to a team member, actively being worked on. Move findings here once someone owns them.<br>' +
      '- <b>Fixed</b>: patched and verified. Mithril auto-closes findings when the vulnerability fingerprint is not seen again after a rescan.<br>' +
      '- <b>Dismissed</b>: false positives or accepted risks. These are hidden from the default view but always accessible.<br><br>' +
      'Inside the table you can filter by severity, date range, discovery source (which tool found it) and target. ' +
      'Click any row to open the finding detail page with full description, CVSS score, affected asset, timeline and remediation guidance.',
    side: 'bottom',
  },
  {
    navigateTo: null,
    selector: '[data-tour="vuln-fastscan"]',
    title: 'Fast Scan',
    description:
      'Kick off an instant, one-off scan without building a full project. ' +
      'Pick a target, select a tool and click Run -- results feed directly into Vulnerabilities within minutes. ' +
      'Ideal for: quick re-verification after patching a finding, testing a new tool against a known target, or ad-hoc scanning outside your regular schedule.',
    side: 'bottom',
  },

  /* ===== PROJECTS ===== */
  {
    navigateTo: null,
    selector: 'a[href="/projects"]',
    title: 'Projects -- automated scan pipelines',
    description:
      'Projects combine targets, a tool pipeline and a cron schedule into one automated workflow. ' +
      'Set it once, Mithril runs it on schedule and merges new findings into Vulnerabilities automatically.',
    side: 'right',
  },
  {
    navigateTo: '/projects',
    selector: '[data-tour="projects-grid"]',
    title: 'Projects grid',
    description:
      'Each project card shows:<br>' +
      '- <b>Project name</b> with a colour indicator you choose.<br>' +
      '- <b>Tool pipeline icons</b>: the ordered list of tools that run in sequence.<br>' +
      '- <b>Next scheduled run</b>: when the next automatic execution is due.<br>' +
      '- <b>Asset count</b>: how many assets are in scope for this project.<br>' +
      '- <b>Severity summary bar</b>: open findings from the last run, by severity.<br>' +
      'Click a card to open the project detail page: <b>Overview</b> (run timeline, charts), <b>Assets</b> (scoped assets), <b>Jobs</b> (run history with logs) and <b>Settings</b>.',
    side: 'top',
  },
  {
    navigateTo: null,
    selector: '[data-tour="create-project"]',
    title: 'Create a project -- the wizard',
    description:
      'Click Create to open the 4-step project wizard:<br>' +
      '1. <b>Name and targets</b>: give the project a name, pick a colour and select which targets to include. You can add all targets or hand-pick specific ones.<br>' +
      '2. <b>Tool pipeline</b>: add tools in the order you want them to run, e.g. Nmap (port discovery) then Nuclei (vuln scan). Each tool in the pipeline uses its default configuration profile.<br>' +
      '3. <b>Schedule</b>: choose a cron schedule (every day at 2am, every Monday, every hour) or leave it unscheduled for manual runs only.<br>' +
      '4. <b>Scope rules</b>: optionally include or exclude assets matching patterns -- e.g. exclude *.staging.example.com or include only assets tagged "prod".<br>' +
      'Save and Mithril runs the pipeline on schedule. You can trigger a manual run any time from the project detail page.',
    side: 'bottom',
  },

  /* ===== AI STUDIO ===== */
  {
    navigateTo: null,
    selector: 'a[href="/aistudio"]',
    title: 'AI Studio -- natural language security operations',
    description:
      'AI Studio connects a large language model directly to your workspace data -- targets, assets, vulnerabilities, scan results and job history. ' +
      'You can ask questions, trigger actions and generate reports, all in plain language.',
    side: 'right',
  },
  {
    navigateTo: '/aistudio',
    selector: '[data-tour="aistudio-prompts"]',
    title: 'Prompt categories',
    description:
      'These chips group example prompts by topic. Click a chip to expand it and see ready-to-use prompts for that category:<br>' +
      '- <b>Recon</b>: enumerate targets, discover subdomains, find exposed services.<br>' +
      '- <b>Vulnerabilities</b>: summarise findings, explain a CVE, list critical issues by asset.<br>' +
      '- <b>SAST</b>: analyse code findings from Semgrep, suggest fixes, explain injection patterns.<br>' +
      '- <b>Reporting</b>: generate executive summaries, compliance snapshots, remediation checklists.<br>' +
      'Hover a prompt to preview it in the input below. Click to fill it in -- you can edit before sending.',
    side: 'top',
  },
  {
    navigateTo: null,
    selector: '[data-tour="aistudio-input"]',
    title: 'Chat input -- Ask and Agent modes',
    description:
      'Type a natural-language command and press Enter or click the send button.<br><br>' +
      '<b>Ask mode</b> (default): read-only analysis. The AI reads your data and answers questions. Examples:<br>' +
      '- "What are my critical vulnerabilities on example.com?"<br>' +
      '- "Which assets have no scan in the last 30 days?"<br>' +
      '- "Explain CVE-2021-44228 and check if I am affected"<br><br>' +
      '<b>Agent mode</b> (toggle in the input): autonomous execution. The AI plans and runs a sequence of actions -- it can trigger scans, install tools, create projects and add targets on your behalf. Examples:<br>' +
      '- "Run a Nuclei scan on the staging target and report critical findings"<br>' +
      '- "Set up a weekly project for all production domains using Nmap and Nuclei"<br>' +
      'Use the <b>Project scope</b> selector above the input to focus the AI on a specific project context.',
    side: 'top',
  },

  /* Done */
  {
    navigateTo: '/',
    selector: null,
    title: "All done!",
    description:
      'You have seen every section of Mithril. The recommended first steps are:<br>' +
      '1. Go to <b>Tools</b> and install Nmap + Nuclei.<br>' +
      '2. Go to <b>Targets</b> and add your first domain.<br>' +
      '3. Go to <b>Projects</b>, create a project, add both tools to the pipeline and run it.<br>' +
      '4. Check <b>Vulnerabilities</b> for findings.<br>' +
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
