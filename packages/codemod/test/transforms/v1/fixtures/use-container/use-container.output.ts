import { createConnection } from "typeorm"
import { Container } from "typedi"

// TODO(typeorm-v1): useContainer() was removed — the container system is no longer supported

Container.set("logger", console)

const connection = await createConnection()
console.log(connection)
