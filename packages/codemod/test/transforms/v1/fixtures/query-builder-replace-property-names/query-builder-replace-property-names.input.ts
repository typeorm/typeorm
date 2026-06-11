import { SelectQueryBuilder } from "typeorm"

class MyQueryBuilder extends SelectQueryBuilder<any> {
    replacePropertyNames(query: string): string {
        return query
    }
}
