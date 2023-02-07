export interface DefaultAuthentication {
    type: "default"
    options: {
        /**
         * User name to use for sql server login.
         */
        userName?: string
        /**
         * Password to use for sql server login.
         */
        password?: string
    }
}
