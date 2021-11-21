import { expect } from "chai";
import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "../../../../src";
import { Post } from "../entity/Post";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    afterUpdate(event: UpdateEvent<Post>): void {
        const { entity, queryRunner: { data } } = event;

        expect(["soft-delete", "restore"]).to.include(data!.action);

        if (data!.action === "soft-delete") {
            expect(Object.prototype.toString.call(entity!.deletedAt)).to.be.eq("[object Date]");
        }

        if (data!.action === "restore") {
            expect(entity!.deletedAt).to.be.null;
        }
    }
}
