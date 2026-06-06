import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { JoinColumn } from "../../../../src/decorator/relations/JoinColumn"
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    tenantId: number

    @Column()
    title: string

    @Column({ nullable: true })
    mainCategoryId: number

    @Column({ nullable: true })
    subCategoryId: number

    @ManyToOne(() => Category)
    @JoinColumn([
        { name: "tenantId", referencedColumnName: "tenantId" },
        { name: "mainCategoryId", referencedColumnName: "id" },
    ])
    mainCategory: Category

    @ManyToOne(() => Category)
    @JoinColumn([
        { name: "tenantId", referencedColumnName: "tenantId" },
        { name: "subCategoryId", referencedColumnName: "id" },
    ])
    subCategory: Category
}
