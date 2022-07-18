import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn, OneToMany } from "typeorm"
import { User } from "./User"

@Entity()
export class Role {
    @PrimaryColumn()
    id: string

    @OneToMany((_) => User, (user) => user.role, { cascade: true })
    users: User[]
}
