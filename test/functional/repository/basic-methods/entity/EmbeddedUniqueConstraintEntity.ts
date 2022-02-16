import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src";


@Entity()
export class EmbeddedUniqueConstraintEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column(() => EmbeddedEntityWithUniqueColumn)
    embedded: EmbeddedEntityWithUniqueColumn;
}

export class EmbeddedEntityWithUniqueColumn {
    @Column({ nullable: true, unique: true })
    id: string;

    @Column({ nullable: true })
    value: string;
}
