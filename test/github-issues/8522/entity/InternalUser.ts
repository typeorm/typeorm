import { ChildEntity } from "typeorm"
import { User } from "./User"

@ChildEntity("internal")
export class InternalUser extends User {}
