import { Person } from "../entities/Person"
import {
    buildGlobalSecondaryIndexes,
    indexedColumns,
} from "../../../../../src/driver/dynamo/helpers/DynamoGlobalSecondaryIndexHelper"
import { expect } from "chai"

describe("dynamo-global-secondary-index-helper", () => {
    it("indexedColumns compound partitionKey", async (): Promise<any> => {
        /** given: **/
        const person1: any = new Person()
        person1.id = "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451"
        person1.firstname = "John"
        person1.lastname = "Doe"
        person1.loginCount = 7

        const metadata: any = {
            indices: [
                {
                    name: "nameIndex",
                    columns: [
                        {
                            propertyName: "firstname",
                        },
                        {
                            propertyName: "lastname",
                        },
                    ],
                    where: "loginCount",
                },
            ],
        }

        /** when: **/
        indexedColumns(metadata, person1)

        /** then: **/
        const partitionKeyColumnValue = person1["firstname#lastname"]
        const sortKeyColumnValue = person1.lastname
        expect(partitionKeyColumnValue).to.eql("firstname#lastname")
        expect(sortKeyColumnValue).to.eql(7)
    })

    it("indexedColumns compound sortKey", async (): Promise<any> => {
        /** given: **/
        const person1: any = new Person()
        person1.id = "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451"
        person1.firstname = "John"
        person1.lastname = "Doe"
        person1.loginCount = 7
        person1.created = "2022-01-01"

        const metadata: any = {
            indices: [
                {
                    name: "nameIndex",
                    columns: [
                        {
                            propertyName: "firstname",
                        },
                        {
                            propertyName: "lastname",
                        },
                    ],
                    where: "loginCount#created",
                },
            ],
        }

        /** when: **/
        indexedColumns(metadata, person1)

        /** then: **/
        const partitionKeyColumnValue = person1["firstname#lastname"]
        const sortKeyColumnValue = person1["loginCount#created"]
        expect(partitionKeyColumnValue).to.eql("John#Doe")
        expect(sortKeyColumnValue).to.eql("7#2022-01-01")
    })

    it("buildGlobalSecondaryIndexSchema compound sortKey", async (): Promise<any> => {
        /** given: **/
        const person1: any = new Person()
        person1.id = "a7abb5c6-f0a7-4ffe-bfc7-6eaa8644f451"
        person1.firstname = "John"
        person1.lastname = "Doe"
        person1.loginCount = 7
        person1.created = "2022-01-01"

        const metadata: any = {
            indices: [
                {
                    name: "nameIndex",
                    columns: [
                        {
                            propertyName: "firstname",
                        },
                        {
                            propertyName: "lastname",
                        },
                    ],
                    where: "loginCount#created",
                },
            ],
        }

        /** when: **/
        const schema = buildGlobalSecondaryIndexes(metadata)

        /** then: **/
        expect(schema).to.eql([
            {
                IndexName: "nameIndex",
                KeySchema: [
                    {
                        AttributeName: "firstname#lastname",
                        KeyType: "HASH",
                    },
                    {
                        AttributeName: "loginCount#created",
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
