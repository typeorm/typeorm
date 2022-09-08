export class DynamoBatchWriteItem {
    type: "PutRequest" | "DeleteRequest"
    item: any
}
