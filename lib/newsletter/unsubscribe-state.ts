export type UnsubscribePageState =
  | { status: 'subscribed' | 'already' | 'inactive'; email: string }
  | { status: 'invalid' | 'expired' | 'unavailable' };
