import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

AppDataSource.initialize()
  .then(async () => {
    console.log("Database initialized");

    // Create a new user
    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.email = "john@example.com";

    // Save the user
    await AppDataSource.manager.save(user);
    console.log("User saved:", user);

    // Find all users
    const users = await AppDataSource.manager.find(User);
    console.log("All users:", users);
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
    process.exit(1);
  });
