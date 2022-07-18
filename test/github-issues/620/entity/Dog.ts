import { Entity } from "typeorm/index"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Cat } from "./Cat"

@Entity()
export class Dog {
    @PrimaryColumn()
    DogID: string

    @OneToMany((type) => Cat, (cat) => cat.dog)
    cats: Cat[]
}
