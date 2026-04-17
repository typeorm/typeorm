import { ConnectionManager } from "typeorm"
import { ConnectionManager as CM } from "typeorm"

// Case 1: direct instantiation
const manager = new ConnectionManager()

// Case 2: aliased instantiation
const manager2 = new CM()
