import CertificareList from '@/components/certificate/CertificateList'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/_admin/admin/_certification/certification',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <CertificareList/>
}
