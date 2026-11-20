import AddSubject from '@/components/faculty/AddSubject'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_faculty/faculty/add-subject')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AddSubject/>
}
