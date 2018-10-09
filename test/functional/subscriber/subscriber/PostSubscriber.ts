import { EventSubscriber, EntitySubscriberInterface } from "../../../../src";

import {Post} from "../entity/Post";
import {Comment} from "../entity/Comment";
import { BulkLoadEvent } from "../../../../src/subscriber/event/BulkLoadEvent";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    // Load
    async afterBulkLoad(event: BulkLoadEvent<Post>): Promise<void> {
        const posts = event.entities;
        if (!posts.length) {
            return;
        }

        const repo = event.connection.getRepository(Comment);

        const postIds = posts.map(post => post.id);

        const results = await repo.createQueryBuilder("comment")
            .select("comment.postId, count(*) as count")
            .where("comment.postId in (:...postIds)", { postIds })
            .groupBy("comment.postId")
            .getRawMany();

        const resultMap: {[postId: string]: number} = {};
        results.forEach(result => resultMap[result.postId] = parseInt(result.count));

        event.entities.forEach(post => post.commentCount = resultMap[post.id] || 0);
    }
}
