import {Connection} from "../../connection/Connection";
import {QueryRunner} from "../../query-runner/QueryRunner";
import { TypeORMError } from "../../error/TypeORMError";
import { RelationSeparateAttributes } from "./RelationSeparateAttributes";
import { RelationLoader } from "../RelationLoader";

export class RelationSeparateLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    protected relationLoader;

    constructor(protected connection: Connection,
                protected queryRunner: QueryRunner|undefined,
                protected relationSeparateAttributes: RelationSeparateAttributes[]) {
        this.relationLoader = new RelationLoader(this.connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async load(entities: any[]): Promise<void> {
        if(entities.length<=0){
            return;
        }
        await Promise.all(this.relationSeparateAttributes.map(async (attr)=>{
            await Promise.all(entities.map(async (entity)=>{
                await this.loadRelation(attr.relationPath, entity);
            }));
        }));
        return;
    }

    private async loadRelation(relationPath: string, entity: any) {
        const entityMetadata = this.connection.getMetadata(entity.constructor);
        const pathSegments = relationPath.split(".");
        const targetRelation = pathSegments[0];
        const relation = entityMetadata.findRelationWithPropertyPath(targetRelation);
        if(!relation){
            throw new TypeORMError(`Relation with property path ${targetRelation} in ${entityMetadata.name} was not found.`);
        }
        const result = await this.relationLoader.load(relation, entity, this.queryRunner);
        if(pathSegments.length>1){
            await Promise.all(result.map(async (entity)=>{
                await this.loadRelation(pathSegments.splice(1).join("."),entity);
            }));
        }
        if (["one-to-one", "many-to-one"].includes(relation.relationType)) {
            entity[relation.propertyName] = result[0];
        } else {
            entity[relation.propertyName] = result;
        }
    }
}
