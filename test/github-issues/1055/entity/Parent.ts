import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Child } from "./Child";

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @OneToMany(target => Child, child => child.parent, {lazy: true})
    public children: Promise<Child[]>;
}
