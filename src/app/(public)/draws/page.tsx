import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DrawsPage() {
  const supabase = await createClient()
  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Past Draws</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {draws?.map((draw) => (
          <Link key={draw.id} href={`/draws/${draw.id}`} className="block">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ring-1 ring-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {new Date(draw.year, draw.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="mt-4 flex gap-2">
                  {draw.winning_numbers.map((n: number, i: number) => (
                    <span key={i} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!draws || draws.length === 0) && (
          <p className="text-gray-500 col-span-full">No draws have been published yet.</p>
        )}
      </div>
    </div>
  )
}
