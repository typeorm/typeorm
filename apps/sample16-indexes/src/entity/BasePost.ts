import { Column, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Index("my_index_with_id_and_text", ["id", "text"])
export class BasePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    text: string;

    @Index()
    @Column()
    extra: string;

}
