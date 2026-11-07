import { createRemoteJWKSet, jwtVerify } from 'jose';

// Same Firebase project used by the existing client. This is public configuration,
// not a service-account credential. Never import the browser Firebase SDK here.
export const FIREBASE_PROJECT_ID = 'taller-de-carroceria-y-pintura';
const googleKeys = createRemoteJWKSet(new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
));

export interface Identity {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  token: string,
  keys: Parameters<typeof jwtVerify>[1] = googleKeys,
): Promise<Identity> {
  const { payload } = await jwtVerify(token, keys, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
    algorithms: ['RS256'],
    requiredClaims: ['sub', 'exp', 'iat', 'auth_time'],
  });
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || payload.sub.length > 128 ||
      typeof payload.iat !== 'number' || payload.iat > now ||
      typeof payload.auth_time !== 'number' || payload.auth_time > now || payload.auth_time < 0) {
    throw new Error('Invalid Firebase identity');
  }
  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
  };
}

export async function authenticate(request: Request): Promise<Identity> {
  const header = request.headers.get('authorization');
  const match = header?.match(/^Bearer ([^\s]+)$/i);
  if (!match || match[1].length > 16384) throw new Error('Authentication required');
  return verifyFirebaseIdToken(match[1]);
}
