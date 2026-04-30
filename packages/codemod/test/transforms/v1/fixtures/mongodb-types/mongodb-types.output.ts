import { MongoClient, ObjectId } from "mongodb"

const id = new ObjectId()

// A file that ALSO already re-exports `ObjectId` from mongodb should not end
// up with a duplicate declaration — merge into the existing one.
export { SomethingElse, ObjectId } from "mongodb"
