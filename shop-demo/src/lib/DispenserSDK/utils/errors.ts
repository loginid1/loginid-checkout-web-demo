export const errorCodeToMessage: { [id: string]: string } = {
    bad_request: "Bad request",
    user_already_registered: "Username unavailable",
    client_not_created: "Client not created",
    client_not_updated: "Client not updated",
    client_not_deleted: "Client not deleted",
    client_not_activated: "Client not activated",
    client_not_deactivated: "Client not deactivated",
    client_not_verified: "Client not verified",
    client_history_not_created: "Client history not created",
    oidc_client_not_created: "OIDC client not created",
    oidc_client_not_deleted: "OIDC client not deleted",
    oidc_organization_not_found: "OIDC organization not found",
    oidc_scope_not_allowed: "OIDC scope not allowed",
    hydra_client_not_created: "Hydra client not created",
    hydra_client_not_deleted: "Hydra client not deleted",
    username_taken: "Username Unavailable",
    username_empty: "Username Empty",
    username_invalid: "Username Invalid",
    user_not_created: "User not created",
    user_not_updated: "User not updated",
    user_not_verified: "User not verified",
    credential_not_created: "Credential not created",
    user_activity_not_recorded: "User activity not recorded",
    user_device_not_created: "User device not created",
    request_validation_error: "Request Validation Error",
    query_failed: "Query Failed",
    missing_parameter: "Missing Parameter",
    failed_to_send_email: "Failed to send email",
    invalid_registration_code: "Invalid Registration Code",
    invalid_access_code: "Invalid Access Code",
    invalid_registration_link: "Invalid registration link",
    expired_registration_link: "Expired registration link",
    too_manny_registration_attempts: "Too many registration attempts",
    failed_to_authenticate: "Failed to authenticate",
    unauthorized: "Unauthorized",
    operation_not_allowed: "You do not have a permission to complete this action.",
    invalid_credential: "Invalid credentials",
    insufficient_license: "You do not have permission to complete this action. Please sign the appropriate agreements.",
    invalid_jwt: "Invalid token",
    forbidden: "Forbidden",
    endpoint_deprecated: "Error code: D3TVC3RP3D",
    not_found: "Not found",
    oidc_client_not_found: "OIDC client not found",
    authenticator_not_found: "Authenticator not found",
    client_not_found: "Client not found",
    user_not_found: "User not found",
    user_device_not_found: "User device not found",
    credential_not_found: "Credential not found",
    not_acceptable: "Unacceptable",
    oidc_max_client_reached: "OIDC max client limit reached",
    internal_server_error: "An Internal Error has occurred",
    database_error: "A Major Internal Error has occurred",
    missing_body: "Missing body",
    missing_authentication_method: "Missing Authentication",
    oidc_server_error: "OIDC server error",
    account_deactivated: "Account is deactivated",
    remote_session_not_found: "Authentication session not found",
    remote_session_in_progress: "Authentication session in progress",
    remote_session_timeout: "The session has timed out",
    remote_session_maximum_retry_attempts: "Session maximum retry attempts",
    invalid_verification_code: "Invalid verification code",
    verification_code_not_found: "Verification code not found",
    verification_code_expired: "Verification code has expired",
};

export const getErrorMessageByCode = (code: string): string => {
    const msg = errorCodeToMessage[code];
    if (msg !== undefined) return msg;
    return "An unknown error has occurred";
};

export class SDKError extends Error {
    code: string;
    errors: any;
    constructor(code: string, msg: string, errors: any) {
        super(msg);
        this.name = "LoginSDK-Error";
        this.code = code;
        this.errors = errors;
    }
}

export class NavigatorError extends Error {
    constructor() {
        super("Your Identity could not be verified");
        this.name = "NavigatorError";
    }
}

