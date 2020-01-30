import {Post} from "../entity/Post";
<<<<<<< HEAD
import {EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent} from "../../../../src";
=======
import {EntitySubscriberInterface,EventSubscriber,UpdateEvent,InsertEvent} from "../../../../src";
>>>>>>> d50acad246920ce5e7fcca6b119f14039861e98c

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    beforeUpdate(event: UpdateEvent<Post>) {
<<<<<<< HEAD
        if (event.entity) {
            event.entity.dateModified = new Date();
            event.entity.title = 'set in subscriber when updated';
=======
        if(event.entity) {
            event.entity.dateModified=new Date();
            event.entity.title='set in subscriber when updated';
>>>>>>> d50acad246920ce5e7fcca6b119f14039861e98c
        }
    }

    beforeInsert(event: InsertEvent<Post>) {
<<<<<<< HEAD
        if (event.entity) {
            event.entity.dateModified = new Date();
            event.entity.title = 'set in subscriber when created';
=======
        if(event.entity) {
            event.entity.dateModified=new Date();
            event.entity.title='set in subscriber when created';
>>>>>>> d50acad246920ce5e7fcca6b119f14039861e98c
        }
    }
}
