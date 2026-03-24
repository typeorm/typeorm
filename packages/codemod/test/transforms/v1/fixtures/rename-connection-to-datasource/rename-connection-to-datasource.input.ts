import { Connection, ConnectionOptions } from "typeorm"

const options: ConnectionOptions = {
    type: "postgres",
    database: "test",
}

const connection = new Connection(options)
await connection.connect()
console.log(connection.isConnected)
await connection.close()

// Property access: .connection → .dataSource
const ds = queryRunner.connection
const ds2 = event.connection
const ds3 = entityManager.connection

// Should NOT be transformed — not TypeORM
await app.close()
await server.close()
