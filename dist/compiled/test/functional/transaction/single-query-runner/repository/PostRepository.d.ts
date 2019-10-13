import { AbstractRepository } from "../../../../../src/repository/AbstractRepository";
import { Post } from "../entity/Post";
import { EntityManager } from "../../../../../src/entity-manager/EntityManager";
export declare class PostRepository extends AbstractRepository<Post> {
    save(post: Post): Promise<Post>;
    getManager(): EntityManager;
}
