import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  // Security check: Must be an authenticated Admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Double check admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (!['users', 'winners', 'draws'].includes(type || '')) {
    return new NextResponse('Invalid export type', { status: 400 })
  }

  let dataToExport: any[] | null = []

  switch (type) {
    case 'users':
      const { data: usersData } = await supabaseAdmin.from('profiles').select('*, subscriptions(status, plan)')
      dataToExport = usersData
      break;
    case 'winners':
      const { data: winnersData } = await supabaseAdmin.from('winners').select('*, profiles(full_name, email)')
      dataToExport = winnersData
      break;
    case 'draws':
      const { data: drawsData } = await supabaseAdmin.from('draws').select('*')
      dataToExport = drawsData
      break;
  }

  if (!dataToExport || dataToExport.length === 0) {
    return new NextResponse('No data found to export', { status: 404 })
  }

  // Convert JSON to primitive CSV
  const header = Object.keys(dataToExport[0]).join(',')
  const rows = dataToExport.map(row => {
    return Object.values(row).map(val => {
      // Very basic CSV escape
      if (typeof val === 'object' && val !== null) return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
      return val
    }).join(',')
  })

  const csvContent = [header, ...rows].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
