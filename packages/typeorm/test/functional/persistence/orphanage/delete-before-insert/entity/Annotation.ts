import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../../../src"

@Entity()
export class Annotation {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Seen, (seen) => seen.annotation, { cascade: true })
    seen: Seen[]
}

@Entity()
@Unique(["annotation", "userId"])
export class Seen {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userId: number

    @ManyToOne(() => Annotation, (annotation) => annotation.seen, {
        nullable: false,
        orphanedRowAction: "delete",
    })
    annotation: Annotation
}

@Entity()
export class Holder {
    @PrimaryGeneratedColumn()
    id: number

    // restrictive foreign key towards an entity that may be orphaned
    @ManyToOne(() => Seen, { nullable: true, onDelete: "RESTRICT" })
    seen: Seen | null
}
