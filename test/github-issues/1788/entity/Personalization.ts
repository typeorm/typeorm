import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Personalization {
    @PrimaryGeneratedColumn("uuid") public id: number;

    @Column() public logo: string;
}
