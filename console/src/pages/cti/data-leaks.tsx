import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { VulnerabilitiesView } from '@/pages/vulnerabilities/vulnerabilities-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const DataLeaksPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Data Leaks"
      description="Exposed credentials and leaked data associated with your domain"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <VulnerabilitiesView /> : <CreateWorkspace />}
    </Page>
  );
};

export default DataLeaksPage;
