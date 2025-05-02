import * as authSchema from '@everynews/drizzle/auth-schema'
import * as serviceSchema from '@everynews/drizzle/service-schema'

const allSchemas = {
  ...authSchema,
  ...serviceSchema,
}

export default allSchemas
