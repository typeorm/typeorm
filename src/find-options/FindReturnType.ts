import {
    FindOptionsSelect,
    FindOptionsSelectByString,
} from "./FindOptionsSelect"
import {
    FindOptionsRelationByString,
    FindOptionsRelations,
} from "./FindOptionsRelations"
import { ObjectLiteral } from "../common/ObjectLiteral"

type TruthyKeys<T> = {
    [K in keyof T]: true extends T[K] ? K : T[K] extends object ? K : never
}[keyof T]

type ExtractNil<T> = Exclude<T, Exclude<T, undefined | null>>

type ArrayType<I, E> = Array<I> | ExtractNil<E>

type PickSelect<
    Entity extends ObjectLiteral,
    Select extends
        | FindOptionsSelect<Entity>
        | FindOptionsSelectByString<Entity>
        | undefined,
> = Select extends FindOptionsSelectByString<Entity>
    ? {
          [R in Select extends FindOptionsSelectByString<Entity>
              ? Select[number]
              : never]: Entity[R]
      }
    : {
          [R in Select extends FindOptionsSelectByString<Entity>
              ? never
              : TruthyKeys<Select>]: Exclude<
              Entity[R],
              undefined | null
          > extends Array<infer U>
              ? U extends object
                  ? Select[R] extends FindOptionsSelect<U>
                      ? ArrayType<
                            FindReturnType<U, Select[R], undefined>,
                            Entity[R]
                        >
                      : ArrayType<U, Entity[R]>
                  : ArrayType<U, Entity[R]>
              : Entity[R] extends object
              ? Select[R] extends FindOptionsSelect<Entity[R]>
                  ? FindReturnType<Entity[R], Select[R], undefined>
                  : Entity[R]
              : Entity[R]
      }

type PickRelations<
    Entity extends ObjectLiteral,
    Relation extends
        | FindOptionsRelations<Entity>
        | FindOptionsRelationByString
        | undefined,
> = {
    [R in Relation extends FindOptionsRelationByString
        ? never
        : TruthyKeys<Relation>]: Exclude<
        Entity[R],
        undefined | null
    > extends Array<infer U>
        ? U extends object
            ? Relation[R] extends FindOptionsRelations<U>
                ? ArrayType<
                      FindReturnType<U, undefined, Relation[R]>,
                      Entity[R]
                  >
                : ArrayType<U, Entity[R]>
            : ArrayType<U, Entity[R]>
        : Entity[R] extends object
        ? Relation[R] extends FindOptionsRelations<Entity[R]>
            ? FindReturnType<Entity[R], undefined, Relation[R]>
            : Entity[R]
        : Entity[R]
}

export type FindReturnType<
    Entity extends ObjectLiteral,
    Select extends
        | FindOptionsSelect<Entity>
        | FindOptionsSelectByString<Entity>
        | undefined,
    Relation extends
        | FindOptionsRelations<Entity>
        | FindOptionsRelationByString
        | undefined,
> = keyof Select extends never
    ? keyof Relation extends never
        ? Entity
        : Entity & PickRelations<Entity, Relation>
    : keyof Relation extends never
    ? PickSelect<Entity, Select>
    : PickSelect<Entity, Select> & PickRelations<Entity, Relation>
