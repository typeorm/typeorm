import { AbstractRepository, EntityManager, EntityRepository } from "@typeorm/core";
import { Post } from "../entity/Post";

@EntityRepository()
export class PostRepository extends AbstractRepository<Post> {

    save(post: Post) {
        return this.manager.save(post);
    }

    getManager(): EntityManager {
        return this.manager;
    }

}
