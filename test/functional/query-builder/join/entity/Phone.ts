
import {User} from "./User";
import {Entity, PrimaryGeneratedColumn, ManyToOne, Column} from "../../../../../src";

@Entity()
export class Phone {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => User)
    user: User;

    @Column()
    number: number;

}
