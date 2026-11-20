// The same acknowledgement applies to new, pending, confirmed and suppressed
// addresses. Public forms must not disclose somebody else's membership state.
export const SIGNUP_ACKNOWLEDGEMENT = {
  ok: true,
  message: 'Request received. If confirmation is needed, we will email you. Please check your inbox and spam folder.'
} as const;
