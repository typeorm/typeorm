import { DynamoPageable } from "./DynamoPageable"

export class DynamoPage<T> {
    content: T[]
    size: number
    lastEvaluatedKey?: string
    numberOfElements: number
    constructor(
        content: T[],
        pageable: DynamoPageable,
        lastEvaluatedKey?: string,
    ) {
        this.content = content
        this.size = pageable.pageSize
        this.lastEvaluatedKey = lastEvaluatedKey
        this.numberOfElements = this.content.length
    }
}
