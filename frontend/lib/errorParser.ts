/**
 * Helper to extract a clear, human-readable error message from API errors (including HTTP 409 Conflict, 400, etc.)
 */
export function getErrorMessage(error: any, fallbackMessage: string = 'An error occurred. Please try again.'): string {
    if (!error) return fallbackMessage;

    // Direct server response message
    const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
    if (serverMessage && typeof serverMessage === 'string') {
        return serverMessage;
    }

    if (Array.isArray(error?.response?.data?.errors)) {
        return error.response.data.errors.join(', ');
    }

    // Network connection errors
    if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        return 'Unable to connect to server. Please check your internet connection.';
    }

    if (error?.message && typeof error.message === 'string') {
        return error.message;
    }

    return fallbackMessage;
}
