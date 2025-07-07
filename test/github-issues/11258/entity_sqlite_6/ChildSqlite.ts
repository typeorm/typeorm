import { Column, Entity, ManyToOne } from "../../../../src"
import { BaseSqliteEntity } from "./BaseSqlite"
import { ParentSqlite } from "./ParentSqlite"

@Entity("test_child_sqlite_6")
export class ChildSqlite extends BaseSqliteEntity {
    @Column()
    name?: string

    @ManyToOne(() => ParentSqlite, (parent) => parent.entities)
    parent?: ParentSqlite
}
