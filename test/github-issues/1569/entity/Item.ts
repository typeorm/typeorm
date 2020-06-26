import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

export class EmbeddedItem {
    @Column({type: "integer", array: true})
    arrayInsideEmbedded: number[];
}

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    someText: string;

    @Column(type => EmbeddedItem)
    embedded: EmbeddedItem;
}
