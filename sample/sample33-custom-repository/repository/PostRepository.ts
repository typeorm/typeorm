import { Post } from "../entity/Post"
import { Sample33CustomRepositoryDataSource } from "../data-source"

export const PostRepository = Sample33CustomRepositoryDataSource.getRepository(
    Post,
).extend({
    findMyPost() {
        return this.findOne({})
    },
})
