import { Entity, OneToMany } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src"
import { GroupEntity } from "./GroupEntity"

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany("GroupEntity", "user")
    group: GroupEntity
}
