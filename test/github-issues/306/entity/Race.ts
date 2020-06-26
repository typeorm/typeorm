import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { Duration } from "./Duration";

@Entity()
export class Race {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column(type => Duration)
    duration: Duration;

}
