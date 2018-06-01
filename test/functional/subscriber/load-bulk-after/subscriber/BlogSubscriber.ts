import { EventSubscriber, EntitySubscriberInterface } from "../../../../../src";

import {Blog} from "../entity/Blog";
import {Post} from "../entity/Post";
import { BulkLoadEvent } from "../../../../../src/subscriber/event/BulkLoadEvent";

@EventSubscriber()
export class BlogSubscriber implements EntitySubscriberInterface<Blog> {
    listenTo() {
        return Blog;
    }

    async afterBulkLoad(event: BulkLoadEvent<Blog>): Promise<void> {
        const blogs = event.entities;
        if (!blogs.length) {
            return;
        }

        const repo = event.connection.getRepository(Post);

        const blogIds = blogs.map(blog => blog.id);

        const results = await repo.createQueryBuilder("post")
            .select("post.blogId, count(*) as count")
            .where("post.blogId in (:...blogIds)", { blogIds })
            .groupBy("post.blogId")
            .getRawMany();

        const resultMap: {[blogId: string]: number} = {};
        results.forEach(result => resultMap[result.blogId] = parseInt(result.count));

        event.entities.forEach(blog => blog.postCount = resultMap[blog.id] || 0);
  }
}
