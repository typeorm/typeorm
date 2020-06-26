import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Ticket } from "./Ticket";

@Entity()
export class Request {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    owner: string;

    @Column()
    type: string;

    @Column()
    success: boolean;

    @OneToOne(type => Ticket, ticket => ticket.request)
    ticket: Ticket;

}
