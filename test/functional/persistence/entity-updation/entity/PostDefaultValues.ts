import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostDefaultValues {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({default: "hello post"})
    text: string;

    @Column({default: true})
    isActive: boolean;

    @Column({default: () => "CURRENT_TIMESTAMP"})
    addDate: Date;

    @Column({default: 0})
    views: number;

    @Column({nullable: true})
    description: string;

}
