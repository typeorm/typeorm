import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Record {

    @PrimaryGeneratedColumn("uuid")
    id: string;

}
