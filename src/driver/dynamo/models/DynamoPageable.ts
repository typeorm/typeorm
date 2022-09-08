import { DynamoOrder } from "./DynamoOrder"
import { DynamoSort } from "./DynamoSort"

export class DynamoPageable {
    pageNumber: number
    pageSize: number
    sort: DynamoSort
    exclusiveStartKey?: string
    static DEFAULT_PAGE_NUMBER: number = 0
    static DEFAULT_PAGE_SIZE: number = 15
    static ONE: number = 1

    constructor(
        pageNumber: number,
        pageSize?: number,
        sort?: DynamoSort,
        exclusiveStartKey?: string,
    ) {
        this.pageNumber = pageNumber
        this.pageSize = pageSize || DynamoPageable.DEFAULT_PAGE_SIZE
        this.sort = sort || DynamoSort.UNSORTED
        this.exclusiveStartKey = exclusiveStartKey
    }

    toQueryString(prefix?: string) {
        prefix = prefix || "?"
        let sort = this.sort.orders
            .map((order: DynamoOrder) => {
                return `sort=${order.property},${order.direction}`
            })
            .join("&")
        if (sort) {
            sort = `&${sort}`
        }
        return `${prefix}page=${this.pageNumber}&size=${this.pageSize}${sort}`
    }

    static mixin(params: any, pageable?: any) {
        if (pageable) {
            return {
                ...params,
                pageNumber:
                    pageable.pageNumber || DynamoPageable.DEFAULT_PAGE_NUMBER,
                pageSize: pageable.pageSize || DynamoPageable.DEFAULT_PAGE_SIZE,
            }
        }
        return params
    }

    static parse(req: any) {
        const pageNumber = parseInt(
            req.query.page || DynamoPageable.DEFAULT_PAGE_NUMBER,
        )
        const pageSize = parseInt(
            req.query.size || DynamoPageable.DEFAULT_PAGE_SIZE,
        )
        const sort = DynamoSort.parse(req)
        const exclusiveStartKey = req.query.exclusiveStartKey
        return DynamoPageable.of(pageNumber, pageSize, sort, exclusiveStartKey)
    }

    static getDefault() {
        return new DynamoPageable(this.DEFAULT_PAGE_NUMBER)
    }

    static one(sort?: DynamoSort) {
        return new DynamoPageable(this.DEFAULT_PAGE_NUMBER, this.ONE, sort)
    }

    static of(
        pageNumber: number,
        pageSize?: number,
        sort?: DynamoSort,
        exclusiveStartKey?: string,
    ) {
        return new DynamoPageable(pageNumber, pageSize, sort, exclusiveStartKey)
    }
}
