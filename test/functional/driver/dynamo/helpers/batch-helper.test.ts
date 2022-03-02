import { expect } from "chai";
import { batchHelper } from "../../../../../src/driver/dynamo/helpers/BatchHelper";

const buildItems = (count: number) => {
    const items: any[] = [];
    for (let i = 0; i < count; i++) {
        items.push({});
    }
    return items;
};

describe("batch-helper", () => {
    it("zero items", async (): Promise<any> => {
        /** given: **/
        const items: any[] = [];

        /** when: **/
        const batches = batchHelper.batch(items);

        /** then: **/
        expect(batches.length).to.eql(0);
    });
    it("5 items", async (): Promise<any> => {
        /** given: **/
        const items: any[] = buildItems(5);

        /** when: **/
        const batches = batchHelper.batch(items);

        /** then: **/
        expect(batches.length).to.eql(1);
    });
    it("25 items", async (): Promise<any> => {
        /** given: **/
        const items: any[] = buildItems(25);

        /** when: **/
        const batches = batchHelper.batch(items);

        /** then: **/
        expect(batches.length).to.eql(1);
    });
    it("30 items", async (): Promise<any> => {
        /** given: **/
        const items: any[] = buildItems(30);

        /** when: **/
        const batches = batchHelper.batch(items);

        /** then: **/
        expect(batches.length).to.eql(2);
    });
    it("30 items with batch size 5", async (): Promise<any> => {
        /** given: **/
        const items: any[] = buildItems(30);

        /** when: **/
        const batches = batchHelper.batch(items, 5);

        /** then: **/
        expect(batches.length).to.eql(6);
    });
});
