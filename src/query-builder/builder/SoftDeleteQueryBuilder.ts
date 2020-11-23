import {EntityTarget} from "../../common/EntityTarget";
import {EntitySchema} from "../../entity-schema/EntitySchema";
import {UpdateQueryBuilder } from "./UpdateQueryBuilder";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SoftDeleteQueryBuilder<Entity> extends UpdateQueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete/soft-delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: EntityTarget<T>, aliasName?: string): SoftDeleteQueryBuilder<T> {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as SoftDeleteQueryBuilder<T>;
    }
}
