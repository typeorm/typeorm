import { Repository } from "../../../../../src/repository/Repository";
import { EntityManager } from "../../../../../src/entity-manager/EntityManager";
import { Post } from "../entity/Post";
import { Category } from "../entity/Category";
import { CategoryRepository } from "../repository/CategoryRepository";
export declare class PostController {
    save(post: Post, category: Category, entityManager: EntityManager): Promise<void>;
    nonSafeSave(entityManager: EntityManager, post: Post, category: Category): Promise<void>;
    saveWithRepository(post: Post, category: Category, postRepository: Repository<Post>, categoryRepository: CategoryRepository): Promise<Category | undefined>;
    saveWithNonDefaultIsolation(post: Post, category: Category, entityManager: EntityManager): Promise<void>;
}
