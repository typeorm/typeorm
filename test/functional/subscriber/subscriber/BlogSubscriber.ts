import { EventSubscriber, EntitySubscriberInterface } from "../../../../src";

import {Blog} from "../entity/Blog";
import {Post} from "../entity/Post";
import { BulkLoadEvent } from "../../../../src/subscriber/event/BulkLoadEvent";
import { BulkInsertEvent } from "../../../../src/subscriber/event/BulkInsertEvent";
import { BulkUpdateEvent } from "../../../../src/subscriber/event/BulkUpdateEvent";
import { BulkRemoveEvent } from "../../../../src/subscriber/event/BulkRemoveEvent";
import { Changelog } from "../entity/Changelog";

@EventSubscriber()
export class BlogSubscriber implements EntitySubscriberInterface<Blog> {
    listenTo() {
        return Blog;
    }

    // Load
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

    // Insert
    beforeBulkInsert(event: BulkInsertEvent<Blog>): void {
        const now = new Date();
        event.entities.forEach(blog => {
            blog.createDate = now;
            blog.updateDate = now;
        });
    }

    async afterBulkInsert(event: BulkInsertEvent<Blog>): Promise<void> {
        const changes = event.entities.map(blog => {
            const change = new Changelog();
            change.entityType = typeof event.metadata.target === "string" ? event.metadata.target : event.metadata.target.name;
            change.entityId = blog.id;
            change.changeType = "AfterInsert";
            return change;
        });

        await event.connection.manager.insert(Changelog, changes);
    }

    // Update
    beforeBulkUpdate(event: BulkUpdateEvent<Blog>): void {
        const now = new Date();
        event.updates.forEach(update => {
            update.entity.updateDate = now;
        });
    }

    async afterBulkUpdate(event: BulkUpdateEvent<Blog>): Promise<void> {
        const changes = event.updates.map(update => {
            const blog = update.entity;
            const change = new Changelog();
            change.entityType = typeof event.metadata.target === "string" ? event.metadata.target : event.metadata.target.name;
            change.entityId = blog.id;
            change.changeType = "AfterUpdate";
            return change;
        });

        await event.connection.manager.insert(Changelog, changes);
    }

    // Remove
    async beforeBulkRemove(event: BulkRemoveEvent<Blog>): Promise<void> {
        const changes = event.removals.map(removal => {
            const change = new Changelog();
            change.entityType = typeof event.metadata.target === "string" ? event.metadata.target : event.metadata.target.name;
            change.entityId = removal.entityId;
            change.changeType = "BeforeRemove";
            return change;
        });

        await event.connection.manager.insert(Changelog, changes);
    }

    async afterBulkRemove(event: BulkRemoveEvent<Blog>): Promise<void> {
        const changes = event.removals.map(removal => {
            const change = new Changelog();
            change.entityType = typeof event.metadata.target === "string" ? event.metadata.target : event.metadata.target.name;
            change.entityId = removal.entityId;
            change.changeType = "AfterRemove";
            return change;
        });

        await event.connection.manager.insert(Changelog, changes);
    }
}
