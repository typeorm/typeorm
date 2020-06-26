import { Column, Entity, PrimaryGeneratedColumn, ValueTransformer } from "@typeorm/core";

class TagTransformer implements ValueTransformer {

    to(value: string[]): string {
        return value.join(", ");
    }

    from(value: string): string[] {
        return value.split(", ");
    }

}

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: String, transformer: new TagTransformer()})
    tags: string[];

}
