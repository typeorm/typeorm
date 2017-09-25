import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ValueTransformer} from "../../../../../src/decorator/options/ValueTransformer";
import { PostId } from "./PostId";

class PostIdTransformer implements ValueTransformer {

    to (postId: PostId): string {
        return postId.toString();
    }

    from (postId: string): PostId {
        return PostId.fromString(postId);
    }

}

@Entity()
export class PostWithValueObjectId {
    @Column({ primary: true, type: String, transformer: new PostIdTransformer() })
    id: PostId;

    @Column()
    title: string;

    constructor(id: PostId) {
      this.id = id;
    }
}
