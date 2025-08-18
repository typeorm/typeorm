import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    TableInheritance,
} from "../../../../src"

export type RegionType = "country" | "province"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "discriminator" } })
export abstract class Region {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: "varchar" })
    readonly type: RegionType

    @Column()
    name: string

    @ManyToOne(() => Region, (region) => region.children, {
        nullable: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    parent?: Region

    @RelationId((region: Region) => region.parent)
    parentId?: number | null

    @OneToMany(() => Region, (region) => region.parent)
    children: Region[]
}