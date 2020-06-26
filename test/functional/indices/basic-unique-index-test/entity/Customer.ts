import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
@Index("index_name_english", ["nameEnglish"], {unique: true})
export class Customer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nameHebrew: string;

    @Column()
    nameEnglish: string;

}
