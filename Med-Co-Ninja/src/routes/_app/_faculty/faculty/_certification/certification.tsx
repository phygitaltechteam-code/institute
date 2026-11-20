import CertificareList from '@/components/certificate/CertificateList'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_faculty/faculty/_certification/certification',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <CertificareList/>
}
