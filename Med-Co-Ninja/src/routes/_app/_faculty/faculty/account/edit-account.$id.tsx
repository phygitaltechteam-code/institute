import { AddAccount } from '@/components/faculty/account/AddAccount'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/account/edit-account/$id',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddAccount />
}
