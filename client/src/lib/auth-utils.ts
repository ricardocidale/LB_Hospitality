/**
 * Checks whether the given error represents a 401 Unauthorized HTTP response.
 * Tests the error message against a regex pattern matching "401: ...Unauthorized".
 * @param {Error} error - The error object to inspect.
 * @returns {boolean} True if the error message matches the 401 Unauthorized pattern, false otherwise.
 */
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

/**
 * Displays an "Unauthorized" toast notification (if a toast function is provided)
 * and redirects the user to the login page (/api/login) after a 500ms delay.
 * @param {Function} [toast] - Optional toast notification function that accepts an options object with title, description, and variant.
 * @returns {void}
 */
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/api/login";
  }, 500);
}
