'use server'

type DemoRole = 'super_admin' | 'manager' | 'cashier' | 'owner'

export async function getDemoCredentials(role: DemoRole) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    throw new Error('Demo mode is not enabled')
  }

  const map: Record<DemoRole, { email: string; password: string }> = {
    super_admin: {
      email: process.env.DEMO_SUPER_ADMIN_EMAIL!,
      password: process.env.DEMO_SUPER_ADMIN_PASSWORD!,
    },
    manager: {
      email: process.env.DEMO_MANAGER_EMAIL!,
      password: process.env.DEMO_MANAGER_PASSWORD!,
    },
    cashier: {
      email: process.env.DEMO_CASHIER_EMAIL!,
      password: process.env.DEMO_CASHIER_PASSWORD!,
    },
    owner: {
      email: process.env.DEMO_OWNER_EMAIL!,
      password: process.env.DEMO_OWNER_PASSWORD!,
    },
  }

  return map[role]
}
