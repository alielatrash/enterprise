import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Truck } from 'lucide-react'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="mb-8 flex items-center gap-2">
        <Truck className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">Trella Planning</span>
      </div>
      {children}
      <p className="mt-8 text-sm text-muted-foreground">
        Trella Transportation &copy; {new Date().getFullYear()}
      </p>
    </div>
  )
}
