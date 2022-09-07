import { Pageable } from "./Pageable"

export class DynamoPage<T> {
    content: T[]
    size: number
    lastEvaluatedKey?: string
    numberOfElements: number
    constructor(content: T[], pageable: Pageable, lastEvaluatedKey?: string) {
        this.content = content
        this.size = pageable.pageSize
        this.lastEvaluatedKey = lastEvaluatedKey
        this.numberOfElements = this.content.length
    }
}
