import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Flight {

    @PrimaryGeneratedColumn()
    id: number;
    @Column("timestamp with time zone")
    date: Date;

    constructor(id: number, date: Date) {
        this.id = id;
        this.date = date;
    }

}
