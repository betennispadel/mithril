import { axiosInstance } from '@/services/apis/axios-client';

export interface PhishingCampaign {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  target: string;
  recipients: string;
  recipientCount: number;
  templatePreset: string;
  customSubject: string | null;
  customHTML: string | null;
  landingPreset: string;
  durationMinutes: number;
  captureCredentials: boolean;
  capturePasswords: boolean;
  redirectURL: string | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  jobId: string | null;
  configProfileId: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  emailsSent: number;
  emailsOpened: number;
  linksClicked: number;
  credsSubmitted: number;
  emailsReported: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhishingFinding {
  id: string;
  name: string;
  severity: string;
  description: string;
  tags: string[];
  matchedAt: string;
  createdAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  target: string;
  recipients: string;
  templatePreset?: string;
  customSubject?: string;
  customHTML?: string;
  landingPreset?: string;
  durationMinutes?: number;
  captureCredentials?: boolean;
  capturePasswords?: boolean;
  redirectURL?: string;
  configProfileId?: string;
}

export async function getPhishingCampaigns(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: PhishingCampaign[]; total: number }> {
  return axiosInstance.get('/api/phishing-campaigns', { params });
}

export async function getPhishingCampaign(
  id: string,
): Promise<PhishingCampaign> {
  return axiosInstance.get(`/api/phishing-campaigns/${id}`);
}

export async function createPhishingCampaign(
  data: CreateCampaignPayload,
): Promise<PhishingCampaign> {
  return axiosInstance.post('/api/phishing-campaigns', data);
}

export async function launchPhishingCampaign(
  id: string,
): Promise<PhishingCampaign> {
  return axiosInstance.post(`/api/phishing-campaigns/${id}/launch`);
}

export async function getPhishingCampaignResults(
  id: string,
): Promise<{ campaign: PhishingCampaign; findings: PhishingFinding[] }> {
  return axiosInstance.get(`/api/phishing-campaigns/${id}/results`);
}

export async function deletePhishingCampaign(id: string): Promise<void> {
  return axiosInstance.delete(`/api/phishing-campaigns/${id}`);
}
