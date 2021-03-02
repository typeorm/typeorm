import {QueryBuilder} from "./builder/QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryExpressionMap} from "./QueryExpressionMap";
import { Or } from "../expression-builder/expression/logical/Or";
import { And } from "../expression-builder/expression/logical/And";
import { Equal } from "../expression-builder/expression/comparison/Equal";
import { Col } from "../expression-builder/expression/Column";

/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
export class RelationRemover {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryBuilder: QueryBuilder<any, any>,
                protected expressionMap: QueryExpressionMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs remove operation on a relation.
     */
    async remove(value: any|any[]): Promise<void> {
        const relation = this.expressionMap.relationMetadata;

        if (relation.isOneToMany) {

            // if (this.expressionMap.of instanceof Array)
            //     throw new Error(`You cannot update relations of multiple entities with the same related object. Provide a single entity into .of method.`);

            // DELETE FROM post WHERE post.categoryId = of AND post.id = id
            const ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
            if (ofs.length === 0) return;
            const values = Array.isArray(value) ? value : [value];

            const updateSet = relation.inverseRelation!.joinColumns.reduce((updateSet, column) => {
                updateSet[column.propertyName] = null;
                return updateSet;
            }, {} as ObjectLiteral);

            const condition =
                Or(...ofs.map(of =>
                    And(
                        ...relation.inverseRelation!.joinColumns.map(column => Equal(Col(column), of instanceof Object ? column.referencedColumn!.getEntityValue(of) : of)),
                        Or(...values.map(value =>
                            And(...relation.inverseRelation!.entityMetadata.primaryColumns.map(column => Equal(Col(column), value instanceof Object ? column.getEntityValue(value) : value))))))));

            await this.queryBuilder
                .createQueryBuilder()
                .update(relation.inverseEntityMetadata.target)
                .set(updateSet)
                .where(condition)
                .execute();

        } else { // many to many

            const junctionMetadata = relation.junctionEntityMetadata!;
            const ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
            const values = Array.isArray(value) ? value : [value];
            const firstColumnValues = relation.isManyToManyOwner ? ofs : values;
            const secondColumnValues = relation.isManyToManyOwner ? values : ofs;

            const condition = Or(...firstColumnValues.map(firstColumnVal =>
                And(
                    ...junctionMetadata.ownerColumns.map(column => Equal(Col(column.databaseName), firstColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(firstColumnVal) : firstColumnVal)),
                    Or(...secondColumnValues.map(secondColumnVal =>
                        And(...junctionMetadata.inverseColumns.map(column => Equal(Col(column.databaseName), secondColumnVal instanceof Object ? column.referencedColumn!.getEntityValue(secondColumnVal) : secondColumnVal))))))));

            await this.queryBuilder
                .createQueryBuilder()
                .delete()
                .from(junctionMetadata.tableName)
                .where(condition)
                .execute();
        }
    }

}
