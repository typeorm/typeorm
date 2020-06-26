import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @VersionColumn()
    version: string;

}
