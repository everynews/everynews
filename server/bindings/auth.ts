import type { AuthType, auth } from '@everynews/auth'

export type WithAuth = {
  Bindings: AuthType
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}
