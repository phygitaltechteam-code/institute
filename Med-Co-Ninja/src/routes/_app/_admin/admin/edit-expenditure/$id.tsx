import { ExpenditureForm } from '@/components/faculty/expenditure/ExpenditureForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_admin/admin/edit-expenditure/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ExpenditureForm />;
}