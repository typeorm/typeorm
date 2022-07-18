import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("test_entity")
export class TestEntity {
    @PrimaryColumn()
    id1: string

    @PrimaryColumn()
    id2: string

    @Column()
    name: string
}
