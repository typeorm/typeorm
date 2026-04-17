import { Column } from "typeorm"

class Post {
    @Column({
        type: "int",
    })
    postCode: number

    @Column({
        type: "int",
    })
    areaCode: number
}

// Should NOT be transformed — not a @Column decorator
const imageSize = { width: 800, height: 600 }
const progressBar = { width: 40, label: "loading" }
