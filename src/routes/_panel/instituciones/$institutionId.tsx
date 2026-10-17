import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Building2 } from 'lucide-react'
import { CodePanel } from '@/components/admin/code-panel'
import { InstitutionMark } from '@/components/admin/institution-mark'
import { MembersPanel } from '@/components/admin/members-panel'
import { RosterPanel } from '@/components/admin/roster-panel'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'
import { plural } from '@/lib/hnt-admin'
import { useInstitutions } from '@/lib/use-institutions'

export const Route = createFileRoute('/_panel/instituciones/$institutionId')({
  component: InstitutionPage,
})

function InstitutionPage() {
  const { institutionId } = Route.useParams()
  const { institutions, loaded } = useInstitutions()
  const institution = institutions.find(item => item.id === institutionId)

  const back = (
    <Link to="/instituciones" className="inline-flex w-fit items-center gap-1.5 text-(length:--text-sm) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:text-(--foreground)">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Instituciones
    </Link>
  )

  if (!loaded) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando institución" lines={3} avatar /></div>
  if (!institution) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <EmptyState icon={<Building2 />} title="No encontramos esa institución" description="Puede que el link esté mal o que la hayan eliminado." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        {back}
        <div className="flex items-center gap-4">
          <InstitutionMark institution={institution} size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">{institution.name}</h1>
            <p className="truncate text-(--text-secondary)">
              {[institution.fullName, plural(institution.rosterCount, 'persona en la nómina', 'personas en la nómina')].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personas">
        <TabsList aria-label="Secciones de la institución">
          <TabsTrigger value="personas">Personas y roles</TabsTrigger>
          <TabsTrigger value="nomina">Cargar nómina</TabsTrigger>
          <TabsTrigger value="codigo">Código de invitación</TabsTrigger>
        </TabsList>
        <TabsContent value="personas"><MembersPanel institution={institution} /></TabsContent>
        <TabsContent value="nomina"><RosterPanel institution={institution} /></TabsContent>
        <TabsContent value="codigo"><CodePanel institution={institution} /></TabsContent>
      </Tabs>
    </div>
  )
}
