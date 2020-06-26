import { Entity, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from "@typeorm/core";

@Entity({name: "users", schema: "admin"})
@Tree("nested-set")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @TreeParent()
    public manager: User;

    @TreeChildren()
    public managerOf: User[];
}
