import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity({synchronize: false})
export class Album {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}
