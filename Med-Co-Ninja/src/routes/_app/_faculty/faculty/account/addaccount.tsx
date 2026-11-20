import { AddAccount } from '@/components/faculty/account/AddAccount'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/account/addaccount',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return < AddAccount />
}
