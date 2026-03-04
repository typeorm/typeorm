import { Entity, Column, ManyToOne, JoinColumn } from "../../../../src"
import { BaseEntitySqlServer } from "./BaseSqlServer"
import { ParentSqlServer } from "./ParentSqlServer"

@Entity("test_child_sqlserver_3")
export class ChildSqlServer extends BaseEntitySqlServer {
    @Column()
    name?: string

    @ManyToOne(() => ParentSqlServer, { nullable: true })
    @JoinColumn({ name: "parent_id" })
    parent?: ParentSqlServer
}
