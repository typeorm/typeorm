import { ObjectLiteral } from "../common/ObjectLiteral"
import { UpsertType } from "../driver/types/UpsertType"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { QueryBuilder } from "./QueryBuilder"
import { Brackets } from "./Brackets"

export type InsertOrUpdateOptions = {
  /**
   * If true, postgres will skip the update if no values would be changed (reduces writes)
   */
  skipUpdateIfNoValuesChanged?: boolean
  /**
   * If included, postgres will apply the index predicate to a conflict target (partial index)
   */
  indexPredicate?: string
  upsertType?: UpsertType

  /** 分表模式，处理返回新表名 */
  splitTableFunction?: <T extends ObjectLiteral>(
    this: QueryBuilder<T>,
    tablePath: string,
    metadata?: EntityMetadata,
  ) => string | undefined | null
  overwriteCondition?: {
    where: string | Brackets | ObjectLiteral | ObjectLiteral[]
    parameters?: ObjectLiteral
  }
}
