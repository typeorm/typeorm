import { EntityManager } from "../../../src/entity-manager/EntityManager";
import { User } from "../entity/User";
/**
 * Third type of custom repository - extends nothing and accepts entity manager as a first constructor parameter.
 */
export declare class UserRepository {
    private manager;
    constructor(manager: EntityManager);
    createAndSave(firstName: string, lastName: string): Promise<User>;
    findByName(firstName: string, lastName: string): Promise<User | undefined>;
}
