import { expect } from "chai";
import { FindOptions } from "../../../../../src/driver/dynamo/models/FindOptions";
import { UpdateExpressionOptions } from "../../../../../src/driver/dynamo/models/UpdateExpressionOptions";
import { paramHelper } from "../../../../../src/driver/dynamo/helpers/ParamHelper";

const MACHINE_ID = "9117e83c-6e58-424b-9650-6027c8b67386";
const MONTH_ID = `${MACHINE_ID}-2020-12`;
const VARIANCE = "WEEKDAY";
const DAY = "2020-11-27";

describe("param-helper", () => {
    it("find", async (): Promise<any> => {
        /** given: **/
        const options = new FindOptions();
        options.index = "machineIdIndex";
        options.where = {
            machineId: MACHINE_ID
        };

        /** when: **/
        const params = paramHelper.find("local-toucan-scores", options);

        /** then: **/
        expect(params).to.eql({
            ExpressionAttributeNames: {
                "#machineId": "machineId"
            },
            ExpressionAttributeValues: {
                ":machineId": "9117e83c-6e58-424b-9650-6027c8b67386"
            },
            IndexName: "machineIdIndex",
            KeyConditionExpression: "#machineId = :machineId",
            ScanIndexForward: true,
            TableName: "local-toucan-scores"
        });
    });

    it("find beginsWith", async (): Promise<any> => {
        /** given: **/
        const options = new FindOptions();
        options.index = "searchByNameIndex";
        options.where = {
            searchInitial: "m"
        };
        options.beginsWith = {
            attribute: "searchName",
            value: "my-machine"
        };

        /** when: **/
        const params = paramHelper.find("local-toucan-scores", options);

        /** then: **/
        expect(params).to.eql({
            ExpressionAttributeNames: {
                "#searchInitial": "searchInitial",
                "#searchName": "searchName"
            },
            ExpressionAttributeValues: {
                ":searchInitial": "m",
                ":searchName": "my-machine"
            },
            IndexName: "searchByNameIndex",
            KeyConditionExpression: "#searchInitial = :searchInitial and begins_with(#searchName, :searchName)",
            ScanIndexForward: true,
            TableName: "local-toucan-scores"
        });
    });

    it("find with multiple where filters", async (): Promise<any> => {
        /** given: **/
        const options = new FindOptions();
        options.index = "monthIdIndex";
        options.where = {
            monthId: MONTH_ID,
            variance: VARIANCE
        };

        /** when: **/
        const params = paramHelper.find("local-toucan-scores", options);

        /** then: **/
        expect(params).to.eql({
            ExpressionAttributeNames: {
                "#monthId": "monthId",
                "#variance": "variance"
            },
            ExpressionAttributeValues: {
                ":monthId": MONTH_ID,
                ":variance": VARIANCE
            },
            IndexName: "monthIdIndex",
            KeyConditionExpression: "#monthId = :monthId and #variance = :variance",
            ScanIndexForward: true,
            TableName: "local-toucan-scores"
        });
    });
    it("update with ADD", async (): Promise<any> => {
        /** given: **/
        const options = new UpdateExpressionOptions();
        options.addValues = {
            total: 1,
            count: 1
        };
        options.where = {
            machineId: MACHINE_ID,
            day: DAY
        };

        /** when: **/
        const params = paramHelper.update("local-toucan-score-totals", options);

        /** then: **/
        expect(params).to.eql({
            TableName: "local-toucan-score-totals",
            Key: {
                machineId: MACHINE_ID,
                day: DAY
            },
            UpdateExpression: "ADD #total :total, #count :count",
            ExpressionAttributeNames: {
                "#total": "total",
                "#count": "count"
            },
            ExpressionAttributeValues: {
                ":total": 1,
                ":count": 1
            }
        });
    });

    it("update with SET", async (): Promise<any> => {
        /** given: **/
        const options = new UpdateExpressionOptions();
        options.setValues = {
            status: "failed",
            error: "some error occurred",
            invoiceIdAndStatus: "123-failed"
        };
        options.where = {
            invoiceId: 123
        };

        /** when: **/
        const params = paramHelper.update("local-toucan-score-totals", options);

        /** then: **/
        expect(params).to.eql({
            TableName: "local-toucan-score-totals",
            Key: {
                invoiceId: 123
            },
            UpdateExpression: "SET #status = :status, #error = :error, #invoiceIdAndStatus = :invoiceIdAndStatus",
            ExpressionAttributeNames: {
                "#status": "status",
                "#error": "error",
                "#invoiceIdAndStatus": "invoiceIdAndStatus"
            },
            ExpressionAttributeValues: {
                ":status": "failed",
                ":error": "some error occurred",
                ":invoiceIdAndStatus": "123-failed"
            }
        });
    });
});
