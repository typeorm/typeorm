import { Entity, ManyToOne, PrimaryColumn } from "../../../../src";
import { User } from "./user.entity";

@Entity()
export class Photo {
    @PrimaryColumn()
    @ManyToOne(type => User)
    public user: User;

    @PrimaryColumn()
    public name: string;
}
