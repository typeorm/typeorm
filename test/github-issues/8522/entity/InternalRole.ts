import { ChildEntity } from "typeorm"
import { Role } from "./Role"

@ChildEntity("internal")
export class InternalRole extends Role {}
