import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    constructor(id: number, title: string) {
        this.id = id;
        this.title = title;
    }
}

module.exports = {
    type: "mysql",
    name: "test-conn",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: false,
    entities: [Post],
};
