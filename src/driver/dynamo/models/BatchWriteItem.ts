export class BatchWriteItem {
    type: "PutRequest" | "DeleteRequest"
    item: any
}
