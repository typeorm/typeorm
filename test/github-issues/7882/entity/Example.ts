import {
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm"
import { ExampleText } from "./ExampleText"

@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id: string

    @OneToOne(() => ExampleText)
    @JoinColumn()
    exampleText: ExampleText
}
