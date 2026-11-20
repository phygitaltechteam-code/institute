import BatchCreation from '@/components/faculty/batch/BatchCreation'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_commonpage/batchcreateform')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div ><BatchCreation /></div>
}
