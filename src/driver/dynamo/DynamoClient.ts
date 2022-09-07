import { PlatformTools } from "../../platform/PlatformTools"
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client"

const isDebug = () => {
    return process.env["DEBUG_DYNAMODB"] === "true"
}

export class DynamoClient {
    getClient() {
        const AWS = PlatformTools.load("aws-sdk")
        return new AWS.DynamoDB.DocumentClient()
    }

    put(params: DocumentClient.PutItemInput) {
        if (isDebug()) {
            console.log("dynamodb put", params)
        }
        return this.getClient().put(params).promise()
    }

    update(params: DocumentClient.UpdateItemInput) {
        if (isDebug()) {
            console.log("dynamodb update", params)
        }
        return this.getClient().update(params).promise()
    }

    scan(params: DocumentClient.ScanInput) {
        if (isDebug()) {
            console.log("dynamodb scan", params)
        }
        return this.getClient().scan(params).promise()
    }

    query(params: DocumentClient.QueryInput) {
        if (isDebug()) {
            console.log("dynamodb query", params)
        }
        return this.getClient().query(params).promise()
    }

    delete(params: DocumentClient.DeleteItemInput) {
        if (isDebug()) {
            console.log("dynamodb delete", params)
        }
        return this.getClient().delete(params).promise()
    }

    batchGet(params: DocumentClient.BatchGetItemInput) {
        if (isDebug()) {
            console.log("dynamodb batchGet", params)
        }
        return this.getClient().batchGet(params).promise()
    }

    batchWrite(params: DocumentClient.BatchWriteItemInput) {
        if (isDebug()) {
            console.log("dynamodb batchWrite", params)
        }
        return this.getClient().batchWrite(params).promise()
    }

    deleteTable(params: DocumentClient.DeleteTableInput) {
        if (isDebug()) {
            console.log("dynamodb delete table", params)
        }
        return this.getClient().deleteTable(params).promise()
    }
}
