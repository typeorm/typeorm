import { Entity, ManyToOne } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src"
import type { UserEntity } from "./UserEntity"

@Entity()
export class GroupEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne("UserEntity", "group", { onDelete: "RESTRICT" })
    user: UserEntity
}
