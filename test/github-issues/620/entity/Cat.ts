import { Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Dog } from "./Dog";

@Entity()
export class Cat {

    @PrimaryGeneratedColumn()
    id: number;

    // @Column()
    // dogDogID: string; // Need to do this to allow the Foreign Key to work

    @ManyToOne(type => Dog, dog => dog.cats)
    dog: Dog;

}
