import { Repository } from "../../../../../src/repository/Repository";
import { EntityRepository } from "../../../../../src/decorator/EntityRepository";
import {Category} from "../entity/Category";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {

    findByName(name: string) {
        return this.findOne({ name });
    }

}