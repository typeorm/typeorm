import {PlatformTools} from "../../platform/PlatformTools";

export const getDocumentClient = () => {
    const AWS = PlatformTools.load("aws-sdk");
    return new AWS.DynamoDB.DocumentClient();
};

// export class DynamoClient {


    // put (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb put", params);
    //     }
    //     return this.getClient().put(params).promise();
    // }
    //
    // update (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb update", params);
    //     }
    //     return this.getClient().update(params).promise();
    // }
    //
    // scan (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb scan", params);
    //     }
    //     return this.getClient().scan(params).promise();
    // }
    //
    // query (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb query", params);
    //     }
    //     return this.getClient().query(params).promise();
    // }
    //
    // delete (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb delete", params);
    //     }
    //     return this.getClient().delete(params).promise();
    // }
    //
    // batchGet (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb batchGet", params);
    //     }
    //     return this.getClient().batchGet(params).promise();
    // }
    //
    // batchWrite (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb batchWrite", params);
    //     }
    //     return this.getClient().batchWrite(params).promise();
    // }
    //
    // deleteTable (params: any) {
    //     if (environmentUtils.isTrue("DEBUG_DYNAMODB")) {
    //         console.log("dynamodb delete table", params);
    //     }
    //     return this.getClient().deleteTable(params).promise();
    // }
// }
