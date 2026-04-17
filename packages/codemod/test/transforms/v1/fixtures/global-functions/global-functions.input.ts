import { getRepository, getManager, createQueryBuilder } from "typeorm"

const repo = getRepository(User)
const manager = getManager()
const qb = createQueryBuilder("user")

// Barrel re-exports of removed globals should be deleted
export { getRepository, createConnection } from "typeorm"
