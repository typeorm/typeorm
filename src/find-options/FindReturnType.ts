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

type ExtractUndefined<T> = Exclude<T, Exclude<T, undefined>>

type ArrayType<I, E> = Array<I> | ExtractUndefined<E>

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
        : Entity & {
              [R in Relation extends FindOptionsRelationByString
                  ? never
                  : TruthyKeys<Relation>]: Relation extends FindOptionsRelations<Entity>
                  ? Relation[R] extends FindOptionsRelations<Entity[R]>
                      ? FindReturnType<Entity[R], undefined, Relation[R]>
                      : Entity[R]
                  : Entity[R]
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
      } & {
          [R in Select extends FindOptionsSelectByString<Entity>
              ? Select[number]
              : never]: Entity[R]
      } & {
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
