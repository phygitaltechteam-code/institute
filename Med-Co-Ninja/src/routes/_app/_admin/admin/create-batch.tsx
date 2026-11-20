import BatchCreation from '@/components/faculty/batch/BatchCreation'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_admin/admin/create-batch')({
  component: RouteComponent,
})

function RouteComponent() {
  return <BatchCreation/>
}
