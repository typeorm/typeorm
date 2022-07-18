import { AbstractRepository } from "typeorm/repository/AbstractRepository"
import { Post } from "../entity/Post"
import { EntityManager } from "typeorm/entity-manager/EntityManager"
import { EntityRepository } from "typeorm/decorator/EntityRepository"

@EntityRepository()
export class PostRepository extends AbstractRepository<Post> {
    save(post: Post) {
        return this.manager.save(post)
    }

    getManager(): EntityManager {
        return this.manager
    }
}
