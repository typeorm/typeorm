import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        rawFilterCondition(alias) {
            return `${alias} != true`
        },
    })
    isDeactivated: boolean
}
