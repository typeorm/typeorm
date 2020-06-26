import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Contact } from "./Contact";

@Entity()
export class Booking {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Contact, contact => contact.bookings, {eager: true})
    @JoinColumn({
        name: "contact_id",
    })
    contact: Contact;
}
