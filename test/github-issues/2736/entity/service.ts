import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src";
import { User } from "./user";

@Entity()
export class Service {
    constructor(title: string, user: User) {
        this.title = title;
        this.user = user;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => User, user => user.services)
    user: User;
}
