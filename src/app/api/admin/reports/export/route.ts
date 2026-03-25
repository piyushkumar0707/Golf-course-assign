import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]

  for (const row of rows) {
    const values = headers.map((key) => {
      const raw = row[key]
      const text = raw == null ? '' : String(raw)
      const escaped = text.replaceAll('"', '""')
      return `"${escaped}"`
    })
    lines.push(values.join(','))
  }

  return lines.join('\n')
}

export async function GET(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const supabase = await createClient()

  if (!type || !['users', 'winners', 'draws'].includes(type)) {
    return new NextResponse('Invalid type', { status: 400 })
  }

  let rows: any[] = []

  if (type === 'users') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, subscription_status, created_at')
      .order('created_at', { ascending: false })
    if (error) return new NextResponse(error.message, { status: 500 })
    rows = data || []
  }

  if (type === 'winners') {
    const { data, error } = await supabase
      .from('winners')
      .select('id, draw_id, user_id, tier, prize_amount, proof_status, payment_status, created_at')
      .order('created_at', { ascending: false })
    if (error) return new NextResponse(error.message, { status: 500 })
    rows = data || []
  }

  if (type === 'draws') {
    const { data, error } = await supabase
      .from('draws')
      .select('id, month, year, draw_type, status, jackpot_carried_in, jackpot_carry_out, created_at')
      .order('created_at', { ascending: false })
    if (error) return new NextResponse(error.message, { status: 500 })
    rows = data || []
  }

  const csv = toCsv(rows)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-export.csv"`,
    },
  })
}
