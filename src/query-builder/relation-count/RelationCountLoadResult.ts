import type { RelationCountAttribute } from "./RelationCountAttribute"

export interface RelationCountLoadResult {
    relationCountAttribute: RelationCountAttribute
    results: { cnt: any; parentId: any }[]
}
