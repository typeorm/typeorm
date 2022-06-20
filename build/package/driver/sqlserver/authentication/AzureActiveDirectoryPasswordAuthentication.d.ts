export interface AzureActiveDirectoryPasswordAuthentication {
    type: "azure-active-directory-password";
    options: {
        /**
         * A user need to provide `userName` associate to their account.
         */
        userName: string;
        /**
         * A user need to provide `password` associate to their account.
         */
        password: string;
        /**
         * Optional parameter for specific Azure tenant ID
         */
        domain: string;
    };
}
