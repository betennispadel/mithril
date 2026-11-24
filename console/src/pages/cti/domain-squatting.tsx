import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { CtiFindingsView } from '@/pages/cti/cti-findings-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const CtiPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Domain Squatting"
      description="Typosquatting, IDN homograph and domain abuse detection"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <CtiFindingsView category="brand-protection" /> : <CreateWorkspace />}
    </Page>
  );
};

export default CtiPage;
