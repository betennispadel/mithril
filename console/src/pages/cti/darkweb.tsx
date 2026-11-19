import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { VulnerabilitiesView } from '@/pages/vulnerabilities/vulnerabilities-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const DarkwebPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Dark Web Monitor"
      description="Dark web forums, ransomware leak sites and underground markets monitoring"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <VulnerabilitiesView /> : <CreateWorkspace />}
    </Page>
  );
};

export default DarkwebPage;
