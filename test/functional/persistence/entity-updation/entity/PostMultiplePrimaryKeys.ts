import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class PostMultiplePrimaryKeys {

    @PrimaryColumn()
    firstId: number;

    @PrimaryColumn()
    secondId: number;

    @Column({default: "Hello Multi Ids"})
    text: string;

}
