export const IsolationLevels = [
    "READ COMMITTED",
    "READ UNCOMMITTED",
    "REPEATABLE READ",
    "SERIALIZABLE",
    "SNAPSHOT",
] as const

export type IsolationLevel = (typeof IsolationLevels)[number]
