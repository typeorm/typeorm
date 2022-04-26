import {
    PrimaryColumn,
    Generated,
    ManyToMany,
    Entity,
    Column,
    JoinTable,
} from "../../../../../src"

@Entity()
export class FooEntity {
    @PrimaryColumn({ type: "int", width: 10, unsigned: true, nullable: false })
    @Generated()
    public id: number

    @ManyToMany(() => BarEntity)
    @JoinTable({
        name: "foo_bars",
        joinColumns: [
            {
                name: "foo_id",
            },
        ],
        inverseJoinColumns: [
            {
                name: "bar_id",
            },
        ],
    })
    public fooBars: BarEntity[]
}

@Entity()
export class BarEntity {
    @PrimaryColumn({ type: "int", width: 10, unsigned: true })
    @Generated()
    public id: number

    @Column("varchar", { nullable: false, length: 50 })
    public code: string
}
