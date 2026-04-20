import { SelectQueryBuilder } from "typeorm"

class MyQueryBuilder extends SelectQueryBuilder<any> {
    // TODO(typeorm-v1): `replacePropertyNames` was removed — property name replacement is now handled internally
    replacePropertyNames(query: string): string {
        return query
    }
}
