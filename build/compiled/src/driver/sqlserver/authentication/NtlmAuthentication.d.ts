export interface NtlmAuthentication {
    type: "ntlm";
    options: {
        /**
         * User name from your windows account.
         */
        userName: string;
        /**
         * Password from your windows account.
         */
        password: string;
        /**
         * Once you set domain for ntlm authentication type, driver will connect to SQL Server using domain login.
         *
         * This is necessary for forming a connection using ntlm type
         */
        domain: string;
    };
}
