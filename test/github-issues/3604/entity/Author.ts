import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Author {

    @PrimaryGeneratedColumn("uuid")
    id: string;
}
