import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <AdminNav email={session.email} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  )
}