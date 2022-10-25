// import { ObjectId } from "mongodb"

import { PlatformTools } from "../platform/PlatformTools"

export function isValidObjectId(id: any) {
    const ObjectId = PlatformTools.load("mongodb").ObjectId
    try {
        return new ObjectId(id).toString() === id
    } catch (e: any) {
        return false
    }
}
