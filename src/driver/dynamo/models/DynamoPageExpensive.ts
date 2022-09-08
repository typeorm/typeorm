import { DynamoPageable } from "./DynamoPageable"

export class DynamoPageExpensive<T> {
    content: T[]
    totalElements: number
    totalPages: number
    last: boolean
    size: number
    // eslint-disable-next-line id-blacklist
    number: number
    first: boolean
    numberOfElements: number
    constructor(content: T[], pageable: DynamoPageable, total: number) {
        const totalPages = Math.ceil(total / pageable.pageSize)
        this.content = content
        this.totalElements = total
        this.totalPages = totalPages
        this.last = pageable.pageNumber === totalPages - 1
        this.size = pageable.pageSize
        // eslint-disable-next-line id-blacklist
        this.number = pageable.pageNumber
        this.first = pageable.pageNumber === 0
        this.numberOfElements = content.length
    }
}
