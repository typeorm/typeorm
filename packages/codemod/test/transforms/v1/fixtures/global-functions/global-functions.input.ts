import { getRepository, getManager, createQueryBuilder } from "typeorm"

const repo = getRepository(User)
const manager = getManager()
const qb = createQueryBuilder("user")
