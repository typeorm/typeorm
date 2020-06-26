import { Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => User)
    user: User;
}
