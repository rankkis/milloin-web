/**
 * Finnish error message from an API service. The services throw
 * `{ userMessage }`, which resource() wraps in an Error as its cause.
 */
export function resourceErrorMessage(error: unknown): string {
  const { userMessage, cause } = (error ?? {}) as {
    userMessage?: string;
    cause?: { userMessage?: string };
  };
  return userMessage ?? cause?.userMessage ?? 'Lataaminen epäonnistui';
}
