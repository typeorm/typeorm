import { CustomColumnType } from "../driver/types/CustomColumnType"

export function isCustomColumnType(type: any): type is CustomColumnType {
    return !!(
        type &&
        typeof type === "object" &&
        typeof type.getDatabaseIdentifier === "function"
    )
}
