import {Repository} from "../../../../../src/repository/Repository";
import {Transaction} from "../../../../../src/decorator/transaction/Transaction";
import {TransactionManager} from "../../../../../src/decorator/transaction/TransactionManager";
import {TransactionRepository} from "../../../../../src/decorator/transaction/TransactionRepository";
import {EntityManager} from "../../../../../src/entity-manager/EntityManager";

import {Post} from "../entity/Post";
import {Category} from "../entity/Category";
import {CategoryRepository} from "../repository/CategoryRepository";

export class PostController {

    @Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
    async save(post: Post, category: Category, @TransactionManager() entityManager: EntityManager) {
        await entityManager.save(post);
        await entityManager.save(category);
    }

    // this save is not wrapped into the transaction
    async nonSafeSave(entityManager: EntityManager, post: Post, category: Category) {
        await entityManager.save(post);
        await entityManager.save(category);
    }

    @Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
    async saveWithRepository(
        post: Post,
        category: Category,
        @TransactionRepository(Post) postRepository: Repository<Post>,
        @TransactionRepository() categoryRepository: CategoryRepository,
    ) {
        await postRepository.save(post);
        await categoryRepository.save(category);

        return categoryRepository.findByName(category.name);
    }

    @Transaction({ connectionName: "mysql", isolation: "SERIALIZABLE" }) // "mysql" is a connection name. you can not pass it if you are using default connection.
    async saveWithNonDefaultIsolation(post: Post, category: Category, @TransactionManager() entityManager: EntityManager) {
        await entityManager.save(post);
        await entityManager.save(category);
    }

}