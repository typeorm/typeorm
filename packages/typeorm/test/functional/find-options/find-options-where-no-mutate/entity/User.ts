import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        transformer: {
            to: (v: string | null | undefined) =>
                v == null ? v : `${v}-marker`,
            from: (v: string | null | undefined) =>
                v == null ? v : v.replace(/-marker$/, ""),
        },
    })
    name: string
}
