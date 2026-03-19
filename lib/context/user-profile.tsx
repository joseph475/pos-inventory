'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { getMyProfile } from '@/lib/actions/users'
import type { Profile, Branch } from '@/types/database'

interface UserProfileContextValue {
  profile: Profile | null
  branch: Branch | null
  loading: boolean
  refetch: () => void
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  branch: null,
  loading: true,
  refetch: () => {},
})

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    setLoading(true)
    const { profile: p, branch: b } = await getMyProfile()
    setProfile(p)
    setBranch(b)
    setLoading(false)
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile()
    } else if (isLoaded && !user) {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id])

  return (
    <UserProfileContext.Provider value={{ profile, branch, loading, refetch: fetchProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  return useContext(UserProfileContext)
}
