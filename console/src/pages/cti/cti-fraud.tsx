import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { CtiFindingsView } from '@/pages/cti/cti-findings-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const CtiPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Fraud Intelligence"
      description="Stealer logs, credential dumps and fraud activity monitoring"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <CtiFindingsView category="fraud" /> : <CreateWorkspace />}
    </Page>
  );
};

export default CtiPage;
