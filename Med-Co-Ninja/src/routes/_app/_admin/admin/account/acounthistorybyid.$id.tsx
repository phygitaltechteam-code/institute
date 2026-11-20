import { AccountHistoryByid } from '@/components/faculty/account/AccountHistoryByid'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/account/acounthistorybyid/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <AccountHistoryByid />
}
