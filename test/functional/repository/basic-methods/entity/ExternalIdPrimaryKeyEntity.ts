import { Column, Entity, PrimaryColumn } from "../../../../../src";

@Entity()
export class ExternalIdPrimaryKeyEntity {
    @PrimaryColumn()
    externalId: string;

    @Column()
    title: string;

    @Column(() => EmbeddedEntity)
    embedded: EmbeddedEntity;
}

export class EmbeddedEntity {
    @Column({ nullable: true })
    foo: string;

    @Column({ nullable: true })
    bar: string;
}