import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CharitiesPage() {
  const supabase = await createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900">Our Partner Charities</h1>
        <p className="mt-4 text-xl text-gray-500">
          Support these amazing causes just by entering your monthly scores.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {charities?.map((charity) => (
          <div key={charity.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-100 bg-white group hover:shadow-xl transition-shadow">
            <div className="flex-shrink-0 h-48 bg-gray-200 relative overflow-hidden">
               {charity.image_urls?.[0] ? (
                 <img src={charity.image_urls[0]} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">No Image</div>
               )}
               {charity.is_featured && (
                 <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">FEATURED</span>
               )}
            </div>
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{charity.name}</h3>
                <p className="mt-3 text-base text-gray-500 line-clamp-3">
                  {charity.description}
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href={`/charities/${charity.id}`}
                  className="text-indigo-600 font-semibold hover:text-indigo-500"
                >
                  View details &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
