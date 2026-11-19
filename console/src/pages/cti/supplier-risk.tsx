import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { VulnerabilitiesView } from '@/pages/vulnerabilities/vulnerabilities-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const SupplierRiskPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Supplier Risk"
      description="Third-party and supplier risk assessment using sanctions lists and OSINT"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <VulnerabilitiesView /> : <CreateWorkspace />}
    </Page>
  );
};

export default SupplierRiskPage;
