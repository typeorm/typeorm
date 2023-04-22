import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
} from "../../../../src"

@EventSubscriber()
export class AuthorPostSubscriber implements EntitySubscriberInterface {
    static beforeInsertEntity: any
    static afterInsertEntity: any

    listenTo(): Function | string {
        return "author_posts_post"
    }

    beforeInsert({ entity }: InsertEvent<any>) {
        AuthorPostSubscriber.beforeInsertEntity = entity
    }

    afterInsert({ entity }: InsertEvent<any>) {
        AuthorPostSubscriber.afterInsertEntity = entity
    }
}
