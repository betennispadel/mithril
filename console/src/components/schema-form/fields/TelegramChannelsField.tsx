import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface ChannelCategory {
  label: string;
  channels: { id: string; description: string }[];
}

const DEFAULT_CHANNELS: ChannelCategory[] = [
  {
    label: 'CTI News & Defenders',
    channels: [
      { id: 'vxunderground', description: 'Malware samples & threat actor news' },
      { id: 'falconfeeds', description: 'Real-time ransomware + dark web tracker' },
      { id: 'ctinow', description: 'Cyber Threat Intelligence aggregator' },
      { id: 'ransomwatcher', description: 'Data leak notifications' },
    ],
  },
  {
    label: 'Ransomware Groups',
    channels: [
      { id: 'snatch_info', description: 'Snatch ransomware' },
      { id: 'snatch_news', description: 'Snatch news feed' },
      { id: 'bl00dy_Ransomware_Gang', description: 'Bl00dy ransomware' },
      { id: 'k1llsec', description: 'Kill Security ransomware' },
      { id: 'thebrotherhoodcorp', description: 'The Brotherhood ransomware' },
      { id: 'OSINT_without_borders', description: 'Medusa ransomware' },
    ],
  },
  {
    label: 'Hacktivist - Pro-Russian',
    channels: [
      { id: 'noname05716', description: 'NoName057(16) - DDoS on NATO' },
      { id: 'noname05716eng', description: 'NoName057(16) English' },
      { id: 'CyberArmyofRussia_Reborn', description: 'Cyber Army of Russia' },
      { id: 'ZAllianceRU', description: 'Z-Pentest Alliance - SCADA/OT' },
      { id: 'Killneto', description: 'Killnet - DDoS campaigns' },
      { id: 'KILLNETddos', description: 'Killnet DDoS operations' },
      { id: 'itarmyofrussianews', description: 'IT Army of Russia' },
    ],
  },
  {
    label: 'Hacktivist - Pro-Palestinian / MENA',
    channels: [
      { id: 'DarkStormTeams', description: 'Dark Storm Team - DDoS + defacement' },
      { id: 'RipperSec', description: 'RipperSec - SCADA intrusion claims' },
      { id: 'dragonforceio', description: 'DragonForce Malaysia' },
      { id: 'Handala_hack', description: 'Handala - Israel-targeted leaks' },
      { id: 'Handala_backup', description: 'Handala backup leaks' },
    ],
  },
  {
    label: 'Hacktivist - Other',
    channels: [
      { id: 'itarmyofukraine2022', description: 'IT Army of Ukraine' },
      { id: 'TeamIndianCyberForce', description: 'Indian Cyber Force' },
      { id: 'CyberJihadMovement', description: 'Cyber Jihad Movement' },
      { id: 'ARABIAN_GHOSTS', description: 'Arabian Ghosts' },
      { id: 'Anonymous_Guys_313', description: 'Anonymous Guys' },
      { id: 'AnonPioneers', description: 'AnonPioneers' },
    ],
  },
  {
    label: 'DDoS Operators',
    channels: [
      { id: 'alixsecenglish', description: 'Alixsec' },
      { id: 'azzasec_back', description: 'AzzaSec' },
      { id: 'inteid', description: 'Inteid' },
    ],
  },
  {
    label: 'Data Leak / Breach',
    channels: [
      { id: 'breachdetector', description: 'Data leak monitor' },
      { id: 'DataLeakHome', description: 'Data leak notifications' },
      { id: 'baseleeak', description: 'BaseLeak - breach data' },
      { id: 'dropleak', description: 'Database catalog' },
      { id: 'gulfdocs', description: 'Middle East focused leaks' },
      { id: 'UndergroundDataLeaks', description: 'TEAM UNDERGROUND' },
    ],
  },
  {
    label: 'Access Broker / Forums',
    channels: [
      { id: 'DarkForumsHub', description: 'Dark web forum hub' },
      { id: 'zerodayforums', description: 'Zero-day forums' },
      { id: 'DangerZoneForum', description: 'Danger Zone forum' },
    ],
  },
  {
    label: 'Infostealer / Logs',
    channels: [
      { id: 'metastealer_official', description: 'Metastealer' },
      { id: 'Phorcy', description: 'Phorcy Stealer' },
      { id: 'jester_stealer_channel', description: 'Jester Stealer' },
    ],
  },
  {
    label: 'SCADA / ICS / OT',
    channels: [
      { id: 'scadahacking', description: 'SCADA & ICS Security' },
      { id: 'ics_security', description: 'ICS/SCADA Security feeds' },
      { id: 'eksguvenligi', description: 'Global ICS/SCADA Cyber Security' },
    ],
  },
];

const ALL_DEFAULT_IDS = new Set(
  DEFAULT_CHANNELS.flatMap((cat) => cat.channels.map((ch) => ch.id)),
);

function parseChannels(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TelegramChannelsField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const [customInput, setCustomInput] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const channels = useMemo(() => parseChannels(value), [value]);
  const isUsingDefaults = channels.length === 0;

  const effectiveChannels = useMemo(() => {
    if (isUsingDefaults) return [...ALL_DEFAULT_IDS];
    return channels;
  }, [isUsingDefaults, channels]);

  const customChannels = useMemo(
    () => channels.filter((ch) => !ALL_DEFAULT_IDS.has(ch)),
    [channels],
  );

  const commitChannels = useCallback(
    (next: string[]) => {
      const sortedNext = [...next].sort();
      const sortedDefaults = [...ALL_DEFAULT_IDS].sort();
      if (
        sortedNext.length === sortedDefaults.length &&
        sortedNext.every((v, i) => v === sortedDefaults[i])
      ) {
        onChange('');
        return;
      }
      onChange(next.join(','));
    },
    [onChange],
  );

  const toggleChannel = useCallback(
    (id: string) => {
      const current = new Set(effectiveChannels);
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      commitChannels([...current]);
    },
    [effectiveChannels, commitChannels],
  );

  const toggleCategory = useCallback(
    (cat: ChannelCategory) => {
      const current = new Set(effectiveChannels);
      const catIds = cat.channels.map((ch) => ch.id);
      const allOn = catIds.every((id) => current.has(id));
      if (allOn) {
        catIds.forEach((id) => current.delete(id));
      } else {
        catIds.forEach((id) => current.add(id));
      }
      commitChannels([...current]);
    },
    [effectiveChannels, commitChannels],
  );

  const toggleExpand = useCallback((label: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const addCustomChannel = useCallback(() => {
    const trimmed = customInput.trim().replace(/^@/, '');
    if (!trimmed) return;
    const current = new Set(effectiveChannels);
    if (!current.has(trimmed)) {
      current.add(trimmed);
      commitChannels([...current]);
    }
    setCustomInput('');
  }, [customInput, effectiveChannels, commitChannels]);

  const removeCustomChannel = useCallback(
    (id: string) => {
      const current = effectiveChannels.filter((ch) => ch !== id);
      commitChannels(current);
    },
    [effectiveChannels, commitChannels],
  );

  const selectAll = useCallback(() => {
    const all = new Set([...ALL_DEFAULT_IDS, ...customChannels]);
    commitChannels([...all]);
  }, [customChannels, commitChannels]);

  const deselectAll = useCallback(() => {
    commitChannels([...customChannels]);
  }, [customChannels, commitChannels]);

  const activeDefaultCount = effectiveChannels.filter((ch) =>
    ALL_DEFAULT_IDS.has(ch),
  ).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {activeDefaultCount}/{ALL_DEFAULT_IDS.size} default channels active
          {customChannels.length > 0 && ` + ${customChannels.length} custom`}
          {isUsingDefaults && (
            <span className="ml-1 text-emerald-600 dark:text-emerald-400">
              (using defaults)
            </span>
          )}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={selectAll}
          >
            All on
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={deselectAll}
          >
            All off
          </Button>
        </div>
      </div>

      {/* Category accordion */}
      <div className="max-h-[400px] overflow-y-auto rounded-md border">
        {DEFAULT_CHANNELS.map((cat) => {
          const expanded = expandedCats.has(cat.label);
          const catIds = cat.channels.map((ch) => ch.id);
          const onCount = catIds.filter((id) =>
            effectiveChannels.includes(id),
          ).length;
          const allOn = onCount === catIds.length;

          return (
            <div key={cat.label} className="border-b last:border-b-0">
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50"
                onClick={() => toggleExpand(cat.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(cat.label);
                  }
                }}
              >
                {expanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm font-medium">{cat.label}</span>
                <Badge
                  variant={allOn ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {onCount}/{catIds.length}
                </Badge>
                <Switch
                  checked={allOn}
                  onCheckedChange={() => toggleCategory(cat)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Toggle all ${cat.label} channels`}
                />
              </div>

              {expanded && (
                <div className="border-t bg-muted/20 px-3 py-1">
                  {cat.channels.map((ch) => {
                    const isOn = effectiveChannels.includes(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => toggleChannel(ch.id)}
                          aria-label={`Toggle ${ch.id}`}
                          className="scale-75"
                        />
                        <span className="text-sm font-mono">@{ch.id}</span>
                        <span className="text-xs text-muted-foreground">
                          {ch.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom channels */}
      <div className="space-y-2">
        <span className="text-xs font-medium">Custom channels</span>
        {customChannels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customChannels.map((ch) => (
              <Badge key={ch} variant="secondary" className="gap-1 pr-1">
                <span className="truncate">@{ch}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${ch}`}
                  className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={() => removeCustomChannel(ch)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removeCustomChannel(ch);
                    }
                  }}
                >
                  <X className="size-3" />
                </span>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="@channel_name"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomChannel();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomChannel}
            disabled={!customInput.trim()}
          >
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
