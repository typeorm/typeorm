import * as yargs from "yargs" // Import yargs to define command line options and usage help
import { exec } from "child_process" // Import the `exec` function from Node.js child process module to execute shell commands

/**
 * Shows TypeORM version.
 */
export class VersionCommand implements yargs.CommandModule {
    command = "version" // The name of the command
    describe = "Prints TypeORM version this project uses." // The description of the command

    async handler() {
        // The handler function to execute when the command is invoked
        // Execute `npm list --depth=0` command to get the list of installed packages in the current project
        const localNpmList = await VersionCommand.executeCommand(
            "npm list --depth=0",
        )
        // Extract the version of TypeORM from the local package list
        const localMatches = localNpmList.match(/ typeorm@(.*)\n/)
        const localNpmVersion = (
            localMatches && localMatches[1] ? localMatches[1] : ""
        )
            .replace(/"invalid"/gi, "")
            .trim()

        // Execute `npm list -g --depth=0` command to get the list of globally installed packages
        const globalNpmList = await VersionCommand.executeCommand(
            "npm list -g --depth=0",
        )
        // Extract the version of TypeORM from the global package list
        const globalMatches = globalNpmList.match(/ typeorm@(.*)\n/)
        const globalNpmVersion = (
            globalMatches && globalMatches[1] ? globalMatches[1] : ""
        )
            .replace(/"invalid"/gi, "")
            .trim()

        // Print the version of locally installed TypeORM
        if (localNpmVersion) {
            console.log("Local installed version:", localNpmVersion)
        } else {
            console.log("No local installed TypeORM was found.")
        }

        // Print the version of globally installed TypeORM
        if (globalNpmVersion) {
            console.log("Global installed TypeORM version:", globalNpmVersion)
        } else {
            console.log("No global installed was found.")
        }

        // Check if local and global versions are different and print a warning
        if (
            localNpmVersion &&
            globalNpmVersion &&
            localNpmVersion !== globalNpmVersion
        ) {
            console.log(
                "To avoid issues with CLI please make sure your global and local TypeORM versions match, " +
                    "or you are using locally installed TypeORM instead of global one.",
            )
        }
    }

    // Execute the given shell command and return the output as a string
    protected static executeCommand(command: string) {
        return new Promise<string>((ok, fail) => {
            exec(command, (error: any, stdout: any, stderr: any) => {
                if (stdout) return ok(stdout)
                if (stderr) return ok(stderr)
                if (error) return fail(error)
                ok("")
            })
        })
    }
}
