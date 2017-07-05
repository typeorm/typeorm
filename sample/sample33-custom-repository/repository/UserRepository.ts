import {EntityRepository} from "../../../src/decorator/EntityRepository";
import {EntityManager} from "../../../src/entity-manager/EntityManager";
import {User} from "../entity/User";

/**
 * Third type of custom repository - extends nothing and accepts entity manager as a first constructor parameter.
 */
@EntityRepository()
export class UserRepository {

    constructor(private entityManager: EntityManager) {
    }

    async createAndSave(firstName: string, lastName: string) {
        const user = await this.entityManager.create(User, { firstName, lastName });
        return this.entityManager.save(user);
    }

    async findByName(firstName: string, lastName: string) {
        return this.entityManager.createQueryBuilder(User, "user")
            .where("user.firstName = :firstName AND user.lastName = :lastName")
            .setParameters({ firstName, lastName })
            .getOne();
    }

}