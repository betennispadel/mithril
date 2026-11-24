import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { CtiFindingsView } from '@/pages/cti/cti-findings-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const CtiPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Supplier Risk"
      description="Third-party risk assessment and supply chain monitoring"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <CtiFindingsView category="sanctions" /> : <CreateWorkspace />}
    </Page>
  );
};

export default CtiPage;
