import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("category_test")
export class Category extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
