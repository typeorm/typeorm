import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    constructor(user?: { name: string }) {
        if (user) {
            this.name = user.name;
        }
    }
}
