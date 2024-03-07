export class ApiError extends Error {
    public readonly code: ApiErrorCode;
    public readonly message: string;
    public readonly responseStatus: ApiResponseStatus;
    public readonly httpStatus: number;

    private constructor(
        code: ApiErrorCode,
        message: string,
        responseStatus: ApiResponseStatus,
        httpStatus: number
    ) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.responseStatus = responseStatus;
        Error.captureStackTrace(this, this.constructor);
    }
    
    public static fromApiResponse<T>(response: ApiResponse<T>, httpStatus: number): ApiError {
        if (!this.isErrorResponse(response) || (response.error === undefined)) {
            throw new Error("API response is not an error.")
        }
        return new ApiError(
            response.error.code,
            response.error.message,
            response.status,
            httpStatus
        );
    }


    public static generalServerError(message: string): ApiError {
        return new ApiError(
            ApiErrorCode.GENERAL_SERVER_ERROR,
            message,
            ApiResponseStatus.SERVER_ERROR,
            500
        );
    }
    public static generalClientError(message: string): ApiError {
        return new ApiError(
            ApiErrorCode.GENERAL_CLIENT_ERROR,
            message,
            ApiResponseStatus.CLIENT_ERROR,
            400
        );
    }
    
    public static solanaTxError(txType: SolanaTxType): ApiError {
        return new ApiError(
            ApiErrorCode.SOLANA_TX_ERROR,
            `Solana transaction Error: ${txType}`,
            ApiResponseStatus.SERVER_ERROR,
            500
        )
    }
    public static solanaQueryError(queryType: SolanaQueryType): ApiError {
        return new ApiError(
            ApiErrorCode.SOLANA_QUERY_ERROR,
            `Solana query Error: ${queryType}`,
            ApiResponseStatus.SERVER_ERROR,
            500
        )
    }

    public static isErrorResponse(response: ApiResponse<unknown>): boolean {
        return (response.error !== undefined);
    }

    public toApiResponse<T>(): ApiResponse<T> {
        return {
            error: {
                code: this.code,
                message: this.message
            },
            status: this.responseStatus
        };
    }

}

export enum ApiErrorCode {
    GENERAL_SERVER_ERROR = 0,
    GENERAL_CLIENT_ERROR = 1,
    MISSING_PARAMETER = 2,
    SOLANA_TX_ERROR = 3,
    SOLANA_QUERY_ERROR = 4,
    SOLANA_REQUEST_ERROR = 5
}

export enum SolanaTxType {
    FAILED_TO_CONFIRM = 0,
    FAILED_TO_GENERATE_IX = 1,
}

export enum SolanaQueryType {
    INVALID_ARGUMENT = 0,
    NO_WALLET_CONNECTED = 1,
    UNKNOWN = 2,
    INVALID_EPOCH = 3,
    AUCTION_NOT_INITIALIZED = 4,
    INVALID_WINNER = 5
}


export interface ApiResponse<T> {
    result?: T;
    error?: {
        code: ApiErrorCode;
        message: string;
    };
    status: ApiResponseStatus;
}


export enum ApiResponseStatus {
    SUCCESS = 1,
    CLIENT_ERROR = 2,
    SERVER_ERROR = 3
}