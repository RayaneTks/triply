import { ManualCanvasView } from '@/src/features/modes/ManualCanvasView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Mode manuel | Triply',
};

export default function PlanifierManuelPage() {
  return (
    <AppShell showFooter={false}>
      <ManualCanvasView />
    </AppShell>
  );
}
