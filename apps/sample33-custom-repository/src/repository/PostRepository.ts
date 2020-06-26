import { EntityRepository, Repository } from "@typeorm/core";
import { Post } from "../entity/Post";

/**
 * Second type of custom repository - extends standard repository.
 */
@EntityRepository(Post)
export class PostRepository extends Repository<Post> {

    findMyPost() {
        return this.findOne();
    }

}
