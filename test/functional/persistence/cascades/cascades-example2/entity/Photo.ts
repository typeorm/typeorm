import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: "My photo"})
    name: string;


}
