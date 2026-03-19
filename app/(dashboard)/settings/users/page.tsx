import { getAllUsers, getAllBranches } from '@/lib/actions/users'
import { PendingUsersClient, UsersTableClient } from './assign-user-dialog'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [users, branches] = await Promise.all([getAllUsers(), getAllBranches()])

  // super_admins don't need a branch — only show non-super_admin users without a branch as pending
  const pendingUsers = users.filter((u) => u.branch_id === null && u.role !== 'super_admin')
  const allUsers = users

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage team members, roles, and branch assignments.
        </p>
      </div>

      {/* Pending assignment section */}
      <PendingUsersClient users={pendingUsers} branches={branches} />

      {/* All users section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">All Users</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allUsers.length} {allUsers.length === 1 ? 'member' : 'members'} total
            </p>
          </div>
        </div>

        <UsersTableClient users={allUsers} branches={branches} />
      </section>
    </div>
  )
}
