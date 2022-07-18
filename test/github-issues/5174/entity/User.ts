import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn, ManyToOne } from "typeorm"
import { Role } from "./Role"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @ManyToOne((_) => Role, (role) => role.users)
    role: Role
}
