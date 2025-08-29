import { Entity, Column, OneToMany } from "../../../../src"
import { BaseEntitySqlServer } from "./BaseSqlServer"
import { ChildSqlServer } from "./ChildSqlServer"

@Entity("test_parent_sqlserver_6")
export class ParentSqlServer extends BaseEntitySqlServer {
    @Column()
    name?: string

    @OneToMany(() => ChildSqlServer, (child) => child.parent)
    entities?: ChildSqlServer[]
}
