import { EntityRepository, Repository } from "@typeorm/core";
import { Category } from "../entity/Category";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {

    findByName(name: string) {
        return this.findOne({name});
    }

}
