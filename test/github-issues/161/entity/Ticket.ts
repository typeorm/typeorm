import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Request } from "./Request";

@Entity()
export class Ticket {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Request, {
        cascade: true
    })
    @JoinColumn()
    request: Request;

}
