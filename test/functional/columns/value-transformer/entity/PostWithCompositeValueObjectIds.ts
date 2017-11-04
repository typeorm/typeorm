import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {ValueTransformer} from "../../../../../src/decorator/options/ValueTransformer";
import {PostId} from "./PostId";
import {PostIdPrefix} from "./PostIdPrefix";

class PostIdTransformer implements ValueTransformer {

    to (postId: PostId): string {
        return postId.toString();
    }

    from (postId: string): PostId {
        return PostId.fromString(postId);
    }
}

class PostIdPrefixTransformer implements ValueTransformer {

    to (postIdPrefix: PostIdPrefix): string {
        return postIdPrefix.toString();
    }

    from (postIdPrefix: string): PostIdPrefix {
        return PostIdPrefix.fromString(postIdPrefix);
    }
}

@Entity()
export class PostWithCompositeValueObjectIds {

    @PrimaryColumn({type: String, transformer: new PostIdPrefixTransformer()})
    idPrefix: PostIdPrefix;
    @PrimaryColumn({type: String, transformer: new PostIdTransformer()})
    id: PostId;


    @Column()
    title: string;

    constructor(idPrefix: PostIdPrefix, id: PostId) {
      this.idPrefix = idPrefix;
      this.id = id;
    }
}
