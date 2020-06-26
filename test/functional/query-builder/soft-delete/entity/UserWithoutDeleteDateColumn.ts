import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class UserWithoutDeleteDateColumn {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    likesCount: number = 0;

}
