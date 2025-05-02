import * as authSchema from './auth-schema'
import * as serviceSchema from './service-schema'

const allSchemas = {
  ...authSchema,
  ...serviceSchema,
}

export default allSchemas
