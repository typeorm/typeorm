import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { Profile } from "./Profile";
import { Information } from "./Information";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    registeredAt: Date;

    @Column("json")
    profile: Profile;

    @Column(type => Information)
    information: Information;

}
