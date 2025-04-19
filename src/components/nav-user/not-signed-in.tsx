'use client'

import { RiLoginCircleLine } from '@remixicon/react'
import { Key, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { auth } from '~/auth/client'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '~/components/ui/sidebar'

export const NavUserNotSignedIn = () => {
  const id = useId()

  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(false)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog>
          <DialogTrigger asChild data-slot="sidebar-menu-button">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
              type="button"
            >
              <Avatar className="size-8">
                <AvatarFallback className="rounded-lg">?</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Sign In</span>
              </div>
              <RiLoginCircleLine className="text-muted-foreground/80 ml-auto size-5" />
            </SidebarMenuButton>
          </DialogTrigger>
          <DialogContent>
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <svg
                  className="stroke-zinc-800 dark:stroke-zinc-100"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
                </svg>
              </div>
              <DialogHeader>
                <DialogTitle className="sm:text-center">
                  Welcome back
                </DialogTitle>
                <DialogDescription className="sm:text-center">
                  Enter your credentials to login to your account.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form className="space-y-5">
              <div className="space-y-4">
                <div className="*:not-first:mt-2">
                  <Label htmlFor={`${id}-email`}>Email</Label>
                  <Input
                    id={`${id}-email`}
                    placeholder="hi@yourcompany.com"
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
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Sign in with Magic Link'
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
              <Key size={16} />
              Sign in with Passkey
            </Button>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
