import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"
import { Role } from "../set"

@Entity("post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("set", {
        default: [Role.Admin, Role.Developer],
        enum: Role,
    })
    roles: Role[]
}
