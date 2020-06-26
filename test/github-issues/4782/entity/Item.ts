import { CreateDateColumn, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    date: Date;
}
