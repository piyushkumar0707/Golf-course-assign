import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FadeIn } from '@/components/shared/FadeIn'
import Link from 'next/link'
import { Search } from 'lucide-react'

// Server component reads searchParams directly per Next.js App Router rules
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const page = typeof searchParams.p === 'string' ? parseInt(searchParams.p, 10) : 1
  const pageSize = 25

  let dbQuery = supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, subscription_status', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
  }

  // Pagination bounds
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data: users, count } = await dbQuery.range(from, to)

  const totalPages = count ? Math.ceil(count / pageSize) : 1

  return (
    <div className="space-y-6 max-w-6xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Search users, override subscriptions, and audit score alterations.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Directory</CardTitle>
            <CardDescription>Total directory members: {count || 0}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex gap-2 items-center" action="/admin/users" method="GET">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="q" 
                  defaultValue={query} 
                  placeholder="Search by name or email..." 
                  className="pl-8"
                />
              </div>
              <Button type="submit" variant="secondary">Filter</Button>
              {query && (
                <Link href="/admin/users">
                  <Button variant="ghost">Clear</Button>
                </Link>
              )}
            </form>

            <div className="border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{user.full_name || 'N/A'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{user.email || 'N/A'}</td>
                        <td className="px-4 py-3 capitalize">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.subscription_status || 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button size="sm" variant="outline">Manage</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="text-sm text-muted-foreground">
                Showing {users?.length || 0} results
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/users?q=${query}&p=${Math.max(1, page - 1)}`} 
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>Previous</Button>
                </Link>
                <div className="px-4 py-2 text-sm">
                  Page {page} of {totalPages}
                </div>
                <Link href={`/admin/users?q=${query}&p=${Math.max(totalPages, page + 1)}`}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                  <Button variant="outline" size="sm" disabled={page >= totalPages}>Next</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
