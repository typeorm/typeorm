import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "../../../../src";
import { Service } from "./service";

@Entity()
export class User {
    constructor(name: string) {
        this.name = name;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Service, service => service.user)
    services: Service[];
}
