import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { CharityForm } from './CharityForm'

export default async function CharityMatchPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the user's current profile preferences and all active charities
  const [profileRes, charitiesRes] = await Promise.all([
    supabase.from('profiles').select('charity_id, charity_percent').eq('id', user.id).single(),
    supabase.from('charities').select('id, name').eq('is_active', true).order('name')
  ])

  const profile = profileRes.data
  const charities = charitiesRes.data || []

  return (
    <div className="space-y-8 max-w-5xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charity Match</h1>
          <p className="text-muted-foreground mt-2">
            Configure how your subscription makes an impact. We guarantee a minimum 10% contribution.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Your Impact Preferences</CardTitle>
            <CardDescription>
              Select your preferred charity and configure your contribution split.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {charities.length > 0 ? (
              <CharityForm 
                charities={charities} 
                defaultCharityId={profile?.charity_id!} 
                defaultPercent={profile?.charity_percent || 10} 
              />
            ) : (
              <div className="text-muted-foreground text-sm">
                No active charities are available at this moment. Please check back later!
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
