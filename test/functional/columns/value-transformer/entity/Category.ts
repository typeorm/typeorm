import {CategoryId} from "./CategoryId";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {ValueTransformer} from "../../../../../src/decorator/options/ValueTransformer";

class CategoryIdTransformer implements ValueTransformer {
    to (categoryId: CategoryId): string {
        return categoryId.toString();
    }

    from (categoryId: string): CategoryId {
        return CategoryId.fromString(categoryId);
    }
}

@Entity()
class Category {
  @PrimaryColumn({type: String, transformer: new CategoryIdTransformer()})
  id: CategoryId;
  @Column()
  name: string;

  constructor(id: CategoryId, name: string) {
    // add uuid guard for example
    this.id = id;
    this.name = name;
  }
}

export { Category };

