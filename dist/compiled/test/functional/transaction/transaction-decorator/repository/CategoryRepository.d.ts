import { Repository } from "../../../../../src/repository/Repository";
import { Category } from "../entity/Category";
export declare class CategoryRepository extends Repository<Category> {
    findByName(name: string): Promise<Category | undefined>;
}
