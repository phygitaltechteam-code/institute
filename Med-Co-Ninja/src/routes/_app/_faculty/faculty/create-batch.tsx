import BatchCreation from '@/components/faculty/batch/BatchCreation'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/create-batch')({
  component: RouteComponent,
})

function RouteComponent() {
  return <BatchCreation/>
}
