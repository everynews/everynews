'use client'

import { useId, useState } from 'react'
import { auth } from '~/auth/client'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { SidebarMenu, SidebarMenuItem } from '~/components/ui/sidebar'
import { SpinnerIcon } from '~/icons'
import Image from 'next/image'

export const NavUserNotSignedIn = () => {
  const id = useId()

  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(false)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog>
          <DialogTrigger asChild data-slot="sidebar-menu-button">
            <Button
              className="flex w-full items-center gap-2 px-4 py-2"
              type="button"
            >
              Sign In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <div className="flex flex-col items-center gap-2">
              <Image src="/logo.png" alt="Everynews Logo" width="64" height="64" />
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tighter text-center">
                  Welcome
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-center">
                  Enter your email to sign in or sign up
                </DialogDescription>
              </DialogHeader>
            </div>

            <form className="space-y-5">
              <div className="space-y-4">
                <div className="*:not-first:mt-2">
                  <Input
                    id={`${id}-email`}
                    placeholder="elon@twitter.com"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  disabled={loading}
                  className="w-full gap-2"
                  onClick={async () => {
                    setLoading(true)
                    try {
                      await auth.signIn.magicLink({
                        email,
                      })
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  {loading ? (
                    <SpinnerIcon className="animate-spin" />
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
              </div>
            </form>

            <div className="before:bg-border after:bg-border flex items-center gap-3 before:h-px before:flex-1 after:h-px after:flex-1">
              <span className="text-muted-foreground text-xs">Or</span>
            </div>

            <Button
              variant="outline"
              disabled={loading}
              className="w-full gap-2"
              onClick={async () => {
                setLoading(true)
                try {
                  await auth.signIn.passkey()
                } finally {
                  setLoading(false)
                }
              }}
            >
              Use Passkey
            </Button>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
