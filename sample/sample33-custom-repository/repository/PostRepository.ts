import {Repository} from "../../../src/repository/Repository";
import {Post} from "../entity/Post";
import {EntityRepository} from "../../../src/decorator/EntityRepository";

/**
 * Second type of custom repository - extends standard repository.
 */
@EntityRepository(Post)
export class PostRepository extends Repository<Post> {

    findMyPost() {
        return this.findOne();
    }

}