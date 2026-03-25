import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CharityProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!charity) return notFound()

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/charities" className="text-gray-500 hover:text-gray-900 border border-gray-300 rounded-md px-4 py-2 bg-white flex items-center gap-2">
            <span>&larr;</span> Back to Directory
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
        {/* Images */}
        <div className="flex flex-col-reverse">
          <div className="w-full aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 shadow-xl ring-1 ring-gray-900/5">
            {charity.image_urls?.[0] ? (
              <img src={charity.image_urls[0]} alt={charity.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium bg-gray-200">No Image</div>
            )}
          </div>
          {charity.image_urls?.length > 1 && (
            <div className="mt-6 mb-6 grid grid-cols-4 gap-4">
              {charity.image_urls.slice(1).map((url: string, idx: number) => (
                <div key={idx} className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                  <img src={url} alt={`${charity.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-10 lg:mt-0 flex flex-col items-start px-4 sm:px-0">
          <div className="mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">{charity.name}</h1>
            {charity.is_featured && (
              <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Featured Partner
              </span>
            )}
          </div>

          <div className="prose prose-indigo text-gray-600 max-w-none mb-8">
             <p className="text-xl leading-relaxed">{charity.description}</p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Events & Impacts</h3>
            <div className="space-y-4">
              {charity.events?.map((event: any, idx: number) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-indigo-600">{event.title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{new Date(event.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-800">{event.description}</p>
                </div>
              ))}
              {(!charity.events || charity.events.length === 0) && (
                <p className="text-sm text-gray-500 italic">No upcoming events listed at this time.</p>
              )}
            </div>
          </div>

          <div className="mt-12 w-full flex items-center gap-6">
             <Link
               href="/subscribe"
               className="flex-1 bg-indigo-600 border border-transparent rounded-md py-4 text-center text-lg font-bold text-white uppercase tracking-wider hover:bg-indigo-700 shadow-xl transition-all hover:scale-[1.02]"
             >
               Support this charity
             </Link>
             <Link
                href="#"
                className="flex-1 bg-white border-2 border-indigo-600 py-4 text-center text-lg font-bold text-indigo-600 uppercase tracking-wider rounded-md hover:bg-indigo-50 transition-all hover:scale-[1.02]"
              >
                Direct Donation
              </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
