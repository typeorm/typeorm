import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {ValueTransformer} from "../../../../../src/decorator/options/ValueTransformer";
import {PostId} from "./PostId";
import {Category} from "./Category";

class PostIdTransformer implements ValueTransformer {

    to (postId: PostId): string {
        return postId.toString();
    }

    from (postId: string): PostId {
        return PostId.fromString(postId);
    }
}

@Entity()
export class PostWithEmbeddedPrimaryKey {
    @PrimaryColumn({type: String, transformer: new PostIdTransformer()})
    id: PostId;

    @Column(() => Category)
    category: Category;

    @Column()
    title: string;

    constructor(id: PostId, category: Category) {
      this.id = id;
      this.category = category;
    }
}
