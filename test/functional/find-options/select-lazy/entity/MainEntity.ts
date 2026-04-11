import {
    Column,
    Entity,
    EntityManager,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { OptionA } from "./OptionA"
import { OptionB } from "./OptionB"
import { RelatedEntity } from "./RelatedEntity"

@Entity()
export class MainEntity {
    @PrimaryGeneratedColumn("increment")
    id: number

    // Column that multiple relations share
    @Column("integer", { nullable: true, name: "option_id", unique: true })
    optionId: number | null

    // Multiple relations pointing to the same column
    @OneToOne(() => OptionA, (a) => a.main, {
        lazy: true,
        createForeignKeyConstraints: false,
        persistence: false,
    })
    @JoinColumn({ name: "option_id" })
    optionA: Promise<OptionA | null>

    @OneToOne(() => OptionB, (b) => b.main, {
        lazy: true,
        createForeignKeyConstraints: false,
        persistence: false,
    })
    @JoinColumn({ name: "option_id" })
    optionB: Promise<OptionB | null>

    @Column("integer", { name: "related_id" })
    relatedId: number

    @ManyToOne(() => RelatedEntity, (r) => r.mains, {
        lazy: true,
        onDelete: "NO ACTION",
        onUpdate: "NO ACTION",
    })
    @JoinColumn({ name: "related_id" })
    related: Promise<RelatedEntity>

    @Column("varchar", { default: "" })
    other: string

    async updateRelatedStatus(manager: EntityManager) {
        const related = await this.related
        related.status = true
        await manager.save(this)
        await manager.save(related)
    }
}
