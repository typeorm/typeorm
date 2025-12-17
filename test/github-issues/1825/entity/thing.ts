import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

export class EmbeddedInThing {
    @Column()
    public someSeriouslyLongFieldNameFirst: number

    @Column()
    public someSeriouslyLongFieldNameSecond: number
}

@Entity()
export class Thing {
    @PrimaryGeneratedColumn()
    public id: number

    @Column(() => EmbeddedInThing)
    public embeddedThing: EmbeddedInThing
}
