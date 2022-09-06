import { FindOptions } from "../driver/dynamo/models/FindOptions";
import { commonUtils } from "../driver/dynamo/utils/CommonUtils";
import { Pageable } from "../driver/dynamo/models/Pageable";
import { Page } from "../driver/dynamo/models/Page";
import { DynamoPage } from "../driver/dynamo/models/DynamoPage";
import { DynamoRepository } from "./DynamoRepository";

const encode = (json: object) => {
    if (json) {
        return Buffer.from(JSON.stringify(json)).toString("base64");
    }
    return undefined;
};

const decode = (data: string) => {
    return JSON.parse(Buffer.from(data, "base64").toString("ascii"));
};

export class DynamoPagingAndSortingRepository <T> extends DynamoRepository<T> {
    /**
     * Queries by page size and exclusiveStartKey
     */
    async findPage (options: FindOptions, pageable: Pageable) {
        options.limit = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize;
        options.exclusiveStartKey = pageable.exclusiveStartKey ? decode(pageable.exclusiveStartKey) : undefined;
        if (pageable.sort && pageable.sort.orders && pageable.sort.orders.length > 0) {
            const firstOrder = pageable.sort.orders[0];
            options.sort = firstOrder.direction;
        }
        const items: any = await this.find(options);
        return new DynamoPage(items, pageable, encode(items.lastEvaluatedKey));
    }

    /**
     * Queries ALL items then returns the desired subset
     * WARNING: This is NOT an efficient way of querying dynamodb.
     * Please only use this if you must, preferably on light use pages
     */
    async findPageWithCountExpensive (options: FindOptions, pageable: Pageable) {
        const pageSize = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize;
        const pageNumber = commonUtils.isEmpty(pageable.pageNumber) ? 0 : pageable.pageNumber;
        const items = await this.findAll(options);
        const start = pageNumber * pageSize;
        let count = (pageNumber + 1) * pageSize;
        if (start + count > items.length) {
            count = items.length - start;
        }
        const subset = items.splice(start, count);
        return new Page(subset, pageable, subset.length + items.length);
    }
}
