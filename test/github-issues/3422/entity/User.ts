import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Tree } from "typeorm/decorator/tree/Tree"
import { TreeChildren } from "typeorm/decorator/tree/TreeChildren"
import { TreeParent } from "typeorm/decorator/tree/TreeParent"

@Entity({ name: "users", schema: "admin" })
@Tree("nested-set")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number

    @TreeParent()
    public manager: User

    @TreeChildren()
    public managerOf: User[]
}
