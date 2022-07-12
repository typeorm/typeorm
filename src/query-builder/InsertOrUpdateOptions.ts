import { UpsertType } from "../driver/types/UpsertType"

export type InsertOrUpdateOptions = {
    skipUpdateIfNoValuesChanged?: boolean
    upsertType?: UpsertType
}
