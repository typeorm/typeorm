import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "json", nullable: true})
    config: any;

    @Column({type: "jsonb", nullable: true})
    data: any;

}
