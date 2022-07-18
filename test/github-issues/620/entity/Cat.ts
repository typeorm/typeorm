import { Entity } from "typeorm/index"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Dog } from "./Dog"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Cat {
    @PrimaryGeneratedColumn()
    id: number

    // @Column()
    // dogDogID: string; // Need to do this to allow the Foreign Key to work

    @ManyToOne((type) => Dog, (dog) => dog.cats)
    dog: Dog
}
