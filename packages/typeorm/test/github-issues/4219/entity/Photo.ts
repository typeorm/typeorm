import { Shim } from "../shim"

@Shim.Entity()
export class Photo {
    @Shim.PrimaryGeneratedColumn()
    id: number

    @Shim.Column()
    url: string

    user: any
}
