// Keep this policy aligned with firestore.rules; client checks are not authorization.
type Identity = { email: string | null; emailVerified: boolean } | null;
const OWNER_EMAIL = 'carroceriaypinturanogales@gmail.com';

export function isVerifiedOwner(user: Identity): boolean {
  return !!user?.emailVerified && user.email === OWNER_EMAIL;
}

export function canUseAdministration(user: Identity, hasMembership: boolean): boolean {
  return !!user?.emailVerified && (isVerifiedOwner(user) || hasMembership);
}
