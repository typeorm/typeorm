import { Column, Entity, OneToMany } from "../../../../src"
import { BaseSqliteEntity } from "./BaseSqlite"
import { ChildSqlite } from "./ChildSqlite"

@Entity("test_parent_sqlite_6")
export class ParentSqlite extends BaseSqliteEntity {
    @Column()
    name?: string

    @OneToMany(() => ChildSqlite, (child) => child.parent)
    entities?: ChildSqlite[]
}
