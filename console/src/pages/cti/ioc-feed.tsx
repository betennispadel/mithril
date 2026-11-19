import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { VulnerabilitiesView } from '@/pages/vulnerabilities/vulnerabilities-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const IocFeedPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="IOC Feed"
      description="Threat intelligence feed – IPs, domains and hashes checked against OTX, GreyNoise and AbuseIPDB"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <VulnerabilitiesView /> : <CreateWorkspace />}
    </Page>
  );
};

export default IocFeedPage;
