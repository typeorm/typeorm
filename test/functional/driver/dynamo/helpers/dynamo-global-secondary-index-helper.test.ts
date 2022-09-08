import { DummyEntity } from "../entities/DummyEntity"
import {
    buildGlobalSecondaryIndexes,
    indexedColumns,
} from "../../../../../src/driver/dynamo/helpers/DynamoGlobalSecondaryIndexHelper"
import { expect } from "chai"

describe("dynamo-global-secondary-index-helper", () => {
    it("indexedColumns compound partitionKey", async (): Promise<any> => {
        /** given: **/
        const dummy: any = new DummyEntity()
        dummy.id = "123"
        dummy.adjustmentGroupId = "456"
        dummy.adjustmentStatus = "staged"
        dummy.lineItemNumber = 7

        const metadata: any = {
            indices: [
                {
                    name: "adjustmentGroupIdIndex",
                    columns: [
                        {
                            propertyName: "adjustmentGroupId",
                        },
                        {
                            propertyName: "adjustmentStatus",
                        },
                    ],
                    where: "lineItemNumber",
                },
            ],
        }

        /** when: **/
        indexedColumns(metadata, dummy)

        /** then: **/
        const partitionKeyColumnValue =
            dummy["adjustmentGroupId#adjustmentStatus"]
        const sortKeyColumnValue = dummy.lineItemNumber
        expect(partitionKeyColumnValue).to.eql("456#staged")
        expect(sortKeyColumnValue).to.eql(7)
    })

    it("indexedColumns compound sortKey", async (): Promise<any> => {
        /** given: **/
        const dummy: any = new DummyEntity()
        dummy.id = "123"
        dummy.adjustmentGroupId = "456"
        dummy.adjustmentStatus = "staged"
        dummy.lineItemNumber = 7
        dummy.created = "2022-01-01"

        const metadata: any = {
            indices: [
                {
                    name: "adjustmentGroupIdIndex",
                    columns: [
                        {
                            propertyName: "adjustmentGroupId",
                        },
                        {
                            propertyName: "adjustmentStatus",
                        },
                    ],
                    where: "lineItemNumber#created",
                },
            ],
        }

        /** when: **/
        indexedColumns(metadata, dummy)

        /** then: **/
        const partitionKeyColumnValue =
            dummy["adjustmentGroupId#adjustmentStatus"]
        const sortKeyColumnValue = dummy["lineItemNumber#created"]
        expect(partitionKeyColumnValue).to.eql("456#staged")
        expect(sortKeyColumnValue).to.eql("7#2022-01-01")
    })

    it("buildGlobalSecondaryIndexSchema compound sortKey", async (): Promise<any> => {
        /** given: **/
        const dummy: any = new DummyEntity()
        dummy.id = "123"
        dummy.adjustmentGroupId = "456"
        dummy.adjustmentStatus = "staged"
        dummy.lineItemNumber = 7
        dummy.created = "2022-01-01"

        const metadata: any = {
            indices: [
                {
                    name: "adjustmentGroupIdIndex",
                    columns: [
                        {
                            propertyName: "adjustmentGroupId",
                        },
                        {
                            propertyName: "adjustmentStatus",
                        },
                    ],
                    where: "lineItemNumber#created",
                },
            ],
        }

        /** when: **/
        const schema = buildGlobalSecondaryIndexes(metadata)

        /** then: **/
        expect(schema).to.eql([
            {
                IndexName: "adjustmentGroupIdIndex",
                KeySchema: [
                    {
                        AttributeName: "adjustmentGroupId#adjustmentStatus",
                        KeyType: "HASH",
                    },
                    {
                        AttributeName: "lineItemNumber#created",
                        KeyType: "RANGE",
                    },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
            },
        ])
    })
})
