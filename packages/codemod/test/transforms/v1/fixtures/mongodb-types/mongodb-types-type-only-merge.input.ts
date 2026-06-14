import { MongoClient } from "mongodb"
import { ObjectId } from "typeorm"

const id = new ObjectId()

// A pre-existing type-only re-export must NOT absorb `ObjectId` (a runtime
// value). The transform should create a fresh value re-export instead.
export type { Db } from "mongodb"

export { ObjectId } from "typeorm"
