import { FindOneOptions } from "../FindOneOptions";
import { ObjectLiteral } from "../../common/ObjectLiteral";
/**
 * Defines a special criteria to find specific entity.
 */
export declare type MongoFindOneOptions<Entity = any> = FindOneOptions<Entity> & {
    /**
     * Simple condition that should be applied to match entities.
     */
    where?: ObjectLiteral;
};
