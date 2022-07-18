import { ChildEntity } from "typeorm"
import { Role } from "./Role"

@ChildEntity("internal")
export class ClientRole extends Role {}
