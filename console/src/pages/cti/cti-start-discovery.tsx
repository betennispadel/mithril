import Page from '@/components/common/page';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Globe,
  Mail,
  Key,
  Wallet,
  Monitor,
  MessageCircle,
  Building2,
  User,
  Hash,
  Network,
  Eye,
  Bug,
  Phone,
  Package,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { axiosInstance } from '@/services/apis/axios-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CTI_TARGET_TYPES = [
  { value: 'DOMAIN', label: 'Domain', icon: Globe, color: 'border-blue-500 text-blue-600' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'border-purple-500 text-purple-600' },
  { value: 'KEYWORD', label: 'Keyword', icon: Key, color: 'border-yellow-500 text-yellow-600' },
  { value: 'CRYPTO_WALLET', label: 'Wallet', icon: Wallet, color: 'border-emerald-500 text-emerald-600' },
  { value: 'IP', label: 'IP', icon: Monitor, color: 'border-orange-500 text-orange-600' },
  { value: 'TELEGRAM_CHANNEL', label: 'Telegram', icon: MessageCircle, color: 'border-cyan-500 text-cyan-600' },
  { value: 'ORGANIZATION', label: 'Org', icon: Building2, color: 'border-indigo-500 text-indigo-600' },
  { value: 'THREAT_ACTOR', label: 'Actor', icon: User, color: 'border-red-500 text-red-600' },
  { value: 'FILE_HASH', label: 'Hash', icon: Hash, color: 'border-gray-500 text-gray-600' },
  { value: 'ASN', label: 'ASN', icon: Network, color: 'border-lime-500 text-lime-600' },
  { value: 'ONION', label: 'Onion', icon: Eye, color: 'border-violet-500 text-violet-600' },
  { value: 'CVE', label: 'CVE', icon: Bug, color: 'border-amber-500 text-amber-600' },
  { value: 'URL', label: 'URL', icon: Globe, color: 'border-teal-500 text-teal-600' },
  { value: 'USERNAME', label: 'Username', icon: User, color: 'border-pink-500 text-pink-600' },
  { value: 'PHONE', label: 'Phone', icon: Phone, color: 'border-rose-500 text-rose-600' },
  { value: 'APP_PACKAGE', label: 'App', icon: Package, color: 'border-sky-500 text-sky-600' },
] as const;

const SCHEDULES = [
  { value: 'disabled', label: 'Manual Only' },
  { value: '0 0 * * *', label: 'Daily' },
  { value: '0 0 */3 * *', label: 'Every 3 Days' },
  { value: '0 0 * * 0', label: 'Weekly' },
  { value: '0 0 1 * *', label: 'Monthly' },
];

export default function CtiStartDiscoveryPage() {
  const [selectedType, setSelectedType] = useState('DOMAIN');
  const [inputValue, setInputValue] = useState('');
  const [schedule, setSchedule] = useState('disabled');
  const navigate = useNavigate();

  const discoverMutation = useMutation({
    mutationFn: (targets: { value: string; type: string; scanSchedule: string }[]) =>
      axiosInstance.post('/api/cti-targets/discover', { targets }),
    onSuccess: (response) => {
      const results = response.data;
      const count = Array.isArray(results) ? results.length : 0;
      toast.success('Discovery started for ' + count + ' targets');
      navigate({ to: '/cti' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Discovery failed');
    },
  });

  const handleSubmit = () => {
    const values = inputValue
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      toast.error('Enter at least one target value');
      return;
    }

    const targets = values.map((v) => ({
      value: v,
      type: selectedType,
      scanSchedule: schedule,
    }));

    discoverMutation.mutate(targets);
  };

  const selectedConfig = CTI_TARGET_TYPES.find((t) => t.value === selectedType);

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <Link to="/cti">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <span>CTI Start Discovery</span>
        </div>
      }
      description="Select target type and enter values to begin threat intelligence scanning"
      permission="vulnerability.write"
    >
      {/* Target Type Grid */}
      <div className="space-y-4">
        <label className="text-sm font-medium">Select target type</label>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {CTI_TARGET_TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-all',
                  isSelected
                    ? `${t.color} border-current bg-current/5`
                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="mt-6 space-y-2">
        <label className="text-sm font-medium">
          Enter values (comma or newline separated)
        </label>
        <Textarea
          placeholder={`Enter ${selectedConfig?.label ?? ''} values...`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={6}
          className={cn(
            'font-mono text-sm',
            selectedConfig ? `border-current/20 ${selectedConfig.color}` : '',
          )}
        />
      </div>

      {/* Schedule */}
      <div className="mt-6 space-y-2">
        <label className="text-sm font-medium">Scan Schedule</label>
        <div className="flex gap-2">
          {SCHEDULES.map((s) => (
            <Button
              key={s.value}
              variant={schedule === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSchedule(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={discoverMutation.isPending || !inputValue.trim()}
        >
          {discoverMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Discovery'
          )}
        </Button>
      </div>
    </Page>
  );
}
