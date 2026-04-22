import { createConnection } from "typeorm"

// Class field initializer — `conn = createConnection()` sits inside a
// class body, not inside a Statement or VariableDeclaration. The TODO
// walk must recognize `ClassProperty` / `PropertyDefinition` as a host
// so the removed-API TODO lands on the class field itself.
class UserService {
    conn = createConnection({ type: "postgres" })
}
