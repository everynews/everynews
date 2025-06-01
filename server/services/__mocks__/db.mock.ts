import { mock } from 'bun:test'

/**
 * Mock database utilities for testing Drizzle ORM operations
 */

export interface MockInsertBuilder {
  values: ReturnType<typeof mock>
  returning: ReturnType<typeof mock>
  execute: ReturnType<typeof mock>
}

export interface MockUpdateBuilder {
  set: ReturnType<typeof mock>
  where: ReturnType<typeof mock>
  execute: ReturnType<typeof mock>
}

export interface MockQueryBuilder {
  findFirst: ReturnType<typeof mock>
  findMany: ReturnType<typeof mock>
}

export interface MockDb {
  insert: ReturnType<typeof mock>
  update: ReturnType<typeof mock>
  query: {
    contents: MockQueryBuilder
    stories: MockQueryBuilder
    news: MockQueryBuilder
  }
}

/**
 * Creates a mock insert builder that satisfies Drizzle's PgInsertBuilder interface
 */
export function createMockInsertBuilder(
  returnData?: unknown[],
): MockInsertBuilder {
  const executeSpy = mock(async () => returnData || [{ id: 'test-id' }])
  const returningSpy = mock(() => ({ execute: executeSpy }))
  const valuesSpy = mock(() => ({
    execute: executeSpy,
    returning: returningSpy,
  }))

  return {
    execute: executeSpy,
    returning: returningSpy,
    values: valuesSpy,
  }
}

/**
 * Creates a mock update builder that satisfies Drizzle's PgUpdateBuilder interface
 */
export function createMockUpdateBuilder(): MockUpdateBuilder {
  const executeSpy = mock(async () => {})
  const whereSpy = mock(() => ({ execute: executeSpy }))
  const setSpy = mock(() => ({ where: whereSpy }))

  return {
    execute: executeSpy,
    set: setSpy,
    where: whereSpy,
  }
}

/**
 * Creates a comprehensive mock database that satisfies all Drizzle interfaces
 */
export function createMockDb(
  options: { insertReturnData?: unknown[]; queryReturnData?: unknown } = {},
): MockDb {
  const insertBuilder = createMockInsertBuilder(options.insertReturnData)
  const updateBuilder = createMockUpdateBuilder()

  return {
    insert: mock(() => insertBuilder),
    query: {
      contents: {
        findFirst: mock(async () => options.queryReturnData || null),
        findMany: mock(async () => options.queryReturnData || []),
      },
      news: {
        findFirst: mock(async () => options.queryReturnData || null),
        findMany: mock(async () => options.queryReturnData || []),
      },
      stories: {
        findFirst: mock(async () => options.queryReturnData || null),
        findMany: mock(async () => options.queryReturnData || []),
      },
    },
    update: mock(() => updateBuilder),
  }
}

/**
 * Type-safe mock that extends the base mock with proper Drizzle types
 */
export const mockDbInsert = (returnData?: unknown[]) => {
  const insertBuilder = createMockInsertBuilder(returnData)
  return mock(() => insertBuilder) as unknown
}

/**
 * Type-safe mock that extends the base mock with proper Drizzle types
 */
export const mockDbUpdate = () => {
  const updateBuilder = createMockUpdateBuilder()
  return mock(() => updateBuilder) as unknown
}
