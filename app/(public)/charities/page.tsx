import { createClient } from '@/lib/supabase/server'
import { FadeIn } from '@/components/shared/FadeIn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export const revalidate = 60 // Revalidate every minute

export default async function CharitiesPage() {
  const supabase = createClient()
  
  // Fetch only active charities
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="container py-12 px-4 md:px-6">
      <FadeIn>
        <div className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Our Charity Partners</h1>
          <p className="text-xl text-muted-foreground">
            Explore the incredible organizations making a difference. As a member, you can allocate your subscription percentage to support these directly.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {charities?.map((charity, index) => (
          <FadeIn key={charity.id} delay={index * 0.1}>
            <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg">
              {charity.image_url ? (
                <div className="relative w-full h-48 bg-muted">
                  <Image 
                    src={charity.image_url} 
                    alt={charity.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">No Image Provided</span>
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-xl">{charity.name}</CardTitle>
                  {charity.is_featured && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-4 text-base">
                  {charity.description || 'Information coming soon.'}
                </CardDescription>
              </CardContent>
            </Card>
          </FadeIn>
        ))}

        {!charities?.length && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No active charities available at the moment. Please check back later.
          </div>
        )}
      </div>
    </div>
  )
}
