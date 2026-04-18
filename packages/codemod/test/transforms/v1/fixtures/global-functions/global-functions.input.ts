import {
    getConnection,
    getRepository,
    getManager,
    createQueryBuilder,
} from "typeorm"
import { getRepository as gr } from "typeorm"

const repo = getRepository(User)
const manager = getManager()
const qb = createQueryBuilder("user")
const postRepo = gr(Post)

// getConnection() with no args → dataSource
const ds = getConnection()

// Named connections removed in v1 — argument is dropped, TODO flags manual reconfiguration
const secondary = getConnection("secondary")
