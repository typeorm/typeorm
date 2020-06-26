import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => User, user => user.manyPhotos)
    user: User;

    constructor(name: string) {
        this.name = name;
    }

}
