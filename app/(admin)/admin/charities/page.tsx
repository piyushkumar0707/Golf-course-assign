import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { CharityForm } from './CharityForm'
import { CharityList } from './CharityList'

export default async function AdminCharitiesPage() {
  const { data: charities } = await supabaseAdmin
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-6xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charities Catalog</h1>
          <p className="text-muted-foreground mt-2">
            Manage partner charities. Only one can be featured at a time. Deletion is a soft toggle.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-3">
        <FadeIn delay={0.1} className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Charity</CardTitle>
              <CardDescription>Creates an active charity in the directory.</CardDescription>
            </CardHeader>
            <CardContent>
              <CharityForm mode="create" />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Charities</CardTitle>
            </CardHeader>
            <CardContent>
              <CharityList charities={charities || []} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
