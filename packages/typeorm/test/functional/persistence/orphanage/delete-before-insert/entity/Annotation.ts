import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
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
export class Badge {
    @PrimaryColumn()
    id: number
}

@Entity()
export class Holder {
    @PrimaryGeneratedColumn()
    id: number

    // restrictive foreign key towards an entity that may be orphaned
    @ManyToOne(() => Seen, { nullable: true, onDelete: "RESTRICT" })
    seen: Seen | null

    @ManyToOne(() => Badge, { nullable: true })
    badge: Badge | null
}
