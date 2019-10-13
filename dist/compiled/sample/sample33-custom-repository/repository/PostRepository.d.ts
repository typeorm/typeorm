import { Repository } from "../../../src/repository/Repository";
import { Post } from "../entity/Post";
/**
 * Second type of custom repository - extends standard repository.
 */
export declare class PostRepository extends Repository<Post> {
    findMyPost(): Promise<Post | undefined>;
}
