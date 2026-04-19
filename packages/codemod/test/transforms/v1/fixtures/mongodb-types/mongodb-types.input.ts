import { MongoClient } from "mongodb"
import { ObjectId } from "typeorm"

const id = new ObjectId()

// Barrel re-export should be redirected to mongodb
export { ObjectId } from "typeorm"

// A file that ALSO already re-exports `ObjectId` from mongodb should not end
// up with a duplicate declaration — merge into the existing one.
export { SomethingElse } from "mongodb"
