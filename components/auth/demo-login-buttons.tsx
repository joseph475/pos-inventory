'use client'

import * as React from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Briefcase, ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDemoCredentials } from '@/lib/actions/demo'

type DemoRole = 'super_admin' | 'manager' | 'cashier'

const DEMO_ROLES: {
  role: DemoRole
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Full access — all branches, settings, users',
    icon: ShieldCheck,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    border: 'border-violet-500/30',
  },
  {
    role: 'manager',
    label: 'Manager',
    description: 'Inventory, purchasing, transfers, reports',
    icon: Briefcase,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    border: 'border-blue-500/30',
  },
  {
    role: 'cashier',
    label: 'Cashier',
    description: 'POS only — process sales and held orders',
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
]

export function DemoLoginButtons() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()
  const [loading, setLoading] = React.useState<DemoRole | null>(null)

  async function handleDemoLogin(role: DemoRole) {
    if (fetchStatus !== 'idle' || loading) return
    setLoading(role)
    try {
      const { email, password } = await getDemoCredentials(role)

      // Step 1: identify the user
      const { error: createError } = await signIn.create({ identifier: email })
      if (createError) throw new Error(createError.longMessage ?? createError.message)

      // Step 2: submit password
      const { error: passwordError } = await signIn.password({ password })
      if (passwordError) throw new Error(passwordError.longMessage ?? passwordError.message)

      if (signIn.status !== 'complete') {
        throw new Error('Sign-in could not be completed (MFA or extra step required)')
      }

      // Step 3: activate session and redirect
      await signIn.finalize({ navigate: () => router.push('/dashboard') })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Demo login failed')
      setLoading(null)
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium px-2">Demo Accounts</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {DEMO_ROLES.map(({ role, label, description, icon: Icon, color, bg, border }) => {
          const isThisLoading = loading === role
          const isAnyLoading = loading !== null

          return (
            <button
              key={role}
              onClick={() => handleDemoLogin(role)}
              disabled={isAnyLoading}
              className={`
                flex items-center gap-3 rounded-lg border px-4 py-3 text-left
                transition-colors disabled:cursor-not-allowed disabled:opacity-60
                ${bg} ${border}
              `}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${border}`}>
                {isThisLoading
                  ? <Loader2 className={`h-4 w-4 animate-spin ${color}`} />
                  : <Icon className={`h-4 w-4 ${color}`} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
