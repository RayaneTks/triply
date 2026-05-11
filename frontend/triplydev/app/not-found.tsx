import { NotFoundView } from '@/src/features/errors/NotFoundView';

export const metadata = {
  title: 'Page introuvable | Triply',
};

export default function NotFound() {
  return <NotFoundView />;
}
