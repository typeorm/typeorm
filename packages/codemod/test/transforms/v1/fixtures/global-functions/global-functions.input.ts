import { getRepository, getManager, createQueryBuilder } from "typeorm"
import { getRepository as gr } from "typeorm"

const repo = getRepository(User)
const manager = getManager()
const qb = createQueryBuilder("user")
const postRepo = gr(Post)
