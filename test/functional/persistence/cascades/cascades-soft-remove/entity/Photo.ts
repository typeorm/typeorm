import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(type => User, user => user.manyPhotos)
    user: User;

    constructor(name: string) {
        this.name = name;
    }

}
