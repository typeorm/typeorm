import {
    EntitySubscriberInterface,
    EventSubscriber, InsertEvent,
} from "../../../../src"

@EventSubscriber()
export class AuthorPostWithCascadeSubscriber implements EntitySubscriberInterface {

    static beforeInsertEntity: any
    static afterInsertEntity: any

    listenTo(): Function | string {
        return "author_posts_with_cascade_post_with_cascade"
    }

    beforeInsert({metadata, entity}: InsertEvent<any>) {
        AuthorPostWithCascadeSubscriber.beforeInsertEntity = entity
    }

    afterInsert({metadata, entity}: InsertEvent<any>) {
        AuthorPostWithCascadeSubscriber.afterInsertEntity = entity
    }
}
