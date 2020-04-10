import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";
import { Check } from "../../../../src/decorator/Check";

@Entity("book")
@Check("NR_OF_PAGES", "`nrOfPages` > 80")
export class Book {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    nrOfPages: number;

    @Column()
    @Check("VOLUME", "`volume` > 0")
    volume: number;
}
