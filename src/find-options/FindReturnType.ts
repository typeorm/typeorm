import {FindOptionsSelect, FindOptionsSelectByString} from "./FindOptionsSelect";
import {FindOptionsRelationByString, FindOptionsRelations} from "./FindOptionsRelations";
import {ObjectLiteral} from "../common/ObjectLiteral";


export type FindReturnType<
    Entity extends ObjectLiteral,
    Select extends FindOptionsSelect<Entity> | FindOptionsSelectByString<Entity> | undefined,
    Relation extends FindOptionsRelations<Entity> | FindOptionsRelationByString | undefined
> =
    (keyof Select) extends never
        ?
        (keyof Relation) extends never
            ? Entity
            : Entity & {
            [R in (Relation extends FindOptionsRelationByString
                ? never
                : {
                    [K in keyof Relation]: true extends Relation[K]
                        ? K
                        : Relation[K] extends object
                            ? K
                            : never
                }[keyof Relation])]: Relation extends FindOptionsRelations<Entity>
                ? Relation[R] extends FindOptionsRelations<Entity[R]>
                    ? FindReturnType<Entity[R], undefined, Relation[R]>
                    : Entity[R]
                : Entity[R]
        }
        : {
        [R in Select extends FindOptionsSelectByString<Entity>
            ? never
            : {
                [K in keyof Select]: true extends Select[K]
                    ? K
                    : Select[K] extends object
                        ? K : never
            }[keyof Select]]: Exclude<Entity[R], undefined | null> extends Array<infer U>
            ? U extends object
                ? Select[R] extends FindOptionsSelect<U>
                    ? FindReturnType<U, Select[R], undefined>[] | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
                    : Array<U> | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
                : Array<U> | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
            : Entity[R] extends object
                ? Select[R] extends FindOptionsSelect<Entity[R]>
                    ? FindReturnType<Entity[R], Select[R], undefined>
                    : Entity[R]
                : Entity[R]
    } & {
        [R in Relation extends FindOptionsRelationByString
            ? never
            : {
                [K in keyof Relation]: true extends Relation[K]
                    ? K
                    : Relation[K] extends object
                        ? K
                        : never
            }[keyof Relation]]: Exclude<Entity[R], undefined | null> extends Array<infer U>
            ? U extends object
                ? Relation[R] extends FindOptionsRelations<U>
                    ? FindReturnType<U, undefined, Relation[R]>[] | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
                    : U[] | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
                : U[] | Exclude<Entity[R], Exclude<Entity[R], undefined | null>>
            : Entity[R] extends object
                ? Relation[R] extends FindOptionsRelations<Entity[R]>
                    ? FindReturnType<Entity[R], undefined, Relation[R]>
                    : Entity[R]
                : Entity[R]
    } & {
        [R in Select extends FindOptionsSelectByString<Entity>
            ? Select[number]
            : never]: Entity[R]
    };
