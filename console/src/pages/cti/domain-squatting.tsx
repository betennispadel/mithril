import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { VulnerabilitiesView } from '@/pages/vulnerabilities/vulnerabilities-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const DomainSquattingPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Phishing Intelligence"
      description="Detect typosquatting, phishing, IDN homograph and domain squatting threats targeting your brand"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <VulnerabilitiesView /> : <CreateWorkspace />}
    </Page>
  );
};

export default DomainSquattingPage;
