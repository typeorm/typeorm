import { createConnection, useContainer } from "typeorm"
import { Container } from "typedi"

useContainer(Container)

Container.set("logger", console)

const connection = await createConnection()
console.log(connection)
