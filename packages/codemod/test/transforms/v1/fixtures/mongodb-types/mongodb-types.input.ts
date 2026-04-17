import { ObjectId } from "typeorm"

const id = new ObjectId()

// Barrel re-export should be redirected to mongodb
export { ObjectId } from "typeorm"
