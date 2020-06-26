import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Tournament {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true, length: 200})
    name: string;

    @Column()
    startDate: Date;

    @Column()
    endDate: Date;
}
