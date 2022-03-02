import { Order } from "./Order";
import { Sort } from "./Sort";

export class Pageable {
    pageNumber: number;
    pageSize: number;
    sort: Sort;
    exclusiveStartKey?: string;
    static DEFAULT_PAGE_NUMBER: number = 0;
    static DEFAULT_PAGE_SIZE: number = 15;
    static ONE: number = 1;

    constructor (pageNumber: number, pageSize?: number, sort?: Sort, exclusiveStartKey?: string) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize || Pageable.DEFAULT_PAGE_SIZE;
        this.sort = sort || Sort.UNSORTED;
        this.exclusiveStartKey = exclusiveStartKey;
    }

    toQueryString (prefix?: string) {
        prefix = prefix || "?";
        let sort = this.sort.orders.map((order: Order) => {
            return `sort=${order.property},${order.direction}`;
        }).join("&");
        if (sort) {
            sort = `&${sort}`;
        }
        return `${prefix}page=${this.pageNumber}&size=${this.pageSize}${sort}`;
    }

    static mixin (params: any, pageable?: any) {
        if (pageable) {
            return {
                ...params,
                pageNumber: pageable.pageNumber || Pageable.DEFAULT_PAGE_NUMBER,
                pageSize: pageable.pageSize || Pageable.DEFAULT_PAGE_SIZE
            };
        }
        return params;
    }

    static parse (req: any) {
        const pageNumber = parseInt(req.query.page || Pageable.DEFAULT_PAGE_NUMBER);
        const pageSize = parseInt(req.query.size || Pageable.DEFAULT_PAGE_SIZE);
        const sort = Sort.parse(req);
        const exclusiveStartKey = req.query.exclusiveStartKey;
        return Pageable.of(pageNumber, pageSize, sort, exclusiveStartKey);
    }

    static getDefault () {
        return new Pageable(this.DEFAULT_PAGE_NUMBER);
    }

    static one (sort?: Sort) {
        return new Pageable(this.DEFAULT_PAGE_NUMBER, this.ONE, sort);
    }

    static of (pageNumber: number, pageSize?: number, sort?: Sort, exclusiveStartKey?: string) {
        return new Pageable(pageNumber, pageSize, sort, exclusiveStartKey);
    }
}
