import { PlatformTools } from "../../platform/PlatformTools"

export const getDocumentClient = () => {
    const AWS = PlatformTools.load("aws-sdk")
    return new AWS.DynamoDB.DocumentClient()
}
