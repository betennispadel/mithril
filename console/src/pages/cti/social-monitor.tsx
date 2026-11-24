import Page from '@/components/common/page';
import { useWorkspaceSelector } from '@/hooks/useWorkspaceSelector';
import { CtiFindingsView } from '@/pages/cti/cti-findings-view';
import CreateWorkspace from '@/pages/workspaces/create-workspace';

const CtiPage = () => {
  const { workspaces } = useWorkspaceSelector();
  const hasWorkspace = workspaces.length > 0;
  return (
    <Page
      title="Social Monitor"
      description="Twitter, Telegram and social media threat monitoring"
      permission="vulnerability.read"
    >
      {hasWorkspace ? <CtiFindingsView category="social" /> : <CreateWorkspace />}
    </Page>
  );
};

export default CtiPage;
