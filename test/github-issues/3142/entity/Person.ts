import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { Contact } from "./Contact";

@Entity()
export class Person extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column(_type => Contact)
    contact: Contact;

    // I added the unique: true just for the sake of the example
    @Column({unique: true})
    status: string;
}
