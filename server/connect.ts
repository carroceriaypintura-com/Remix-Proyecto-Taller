import {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  getToken,
  startAuthorization,
  type ConnectTokenParams,
} from '@vercel/connect';
import { authenticate, type Identity } from './firebaseIdentity.js';

const connectors = {
  notion: 'notion/acme-notion',
  airefs: 'airefs/acme-airefs',
  adobe: 'adobe/acme-adobe',
  snowflake: 'snowflake/acme-snowflake',
} as const;
type Provider = keyof typeof connectors;

interface Dependencies {
  authenticate: (request: Request) => Promise<Identity>;
  getToken: typeof getToken;
  startAuthorization: typeof startAuthorization;
  snowflakeSubject: () => string | undefined;
}

function json(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

export function createConnectHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, POST' });
    }
    let identity: Identity;
    try {
      identity = await deps.authenticate(request);
    } catch {
      return json({ error: 'authentication_required' }, 401);
    }
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    if (!provider || !Object.hasOwn(connectors, provider)) {
      return json({ error: 'unsupported_provider' }, 400);
    }
    const key = provider as Provider;
    const connector = connectors[key];
    let params: ConnectTokenParams = { subject: { type: 'user', id: identity.uid } };
    if (key === 'snowflake') {
      // Shared warehouse credentials are reserved for the existing workshop admin.
      if (!identity.emailVerified || identity.email !== 'carroceriaypinturanogales@gmail.com') {
        return json({ error: 'forbidden' }, 403);
      }
      if (request.method === 'POST') {
        return json({ error: 'federation_setup_required' }, 409);
      }
      const sub = deps.snowflakeSubject()?.trim();
      if (!sub) return json({ connector, error: 'connector_not_configured' }, 503);
      // The registered connector supports jwt-bearer, not the app/user subjects.
      // Only trusted server configuration may select the federated identity.
      params = { subject: { type: 'jwt-bearer', sub } };
    }
    try {
      if (request.method === 'POST') {
        const authorization = await deps.startAuthorization(connector, params);
        // The consent URL is not a provider credential. Do not return the
        // authorization response's verifier, request ID or any other field.
        return json({ connector, authorizationUrl: authorization.url });
      }
      const token = await deps.getToken(connector, params);
      if (!token) return json({ connector, error: 'provider_unavailable' }, 502);
      // Never serialize or log a provider token. Future provider calls belong here.
      return json({ connector, status: 'credential_available', providerOperationTested: false });
    } catch (error) {
      if (error instanceof UserAuthorizationRequiredError || error instanceof NoValidTokenError) {
        return json({ connector, error: 'authorization_required' }, 409);
      }
      if (error instanceof ConnectorInstallationRequiredError) {
        return json({ connector, error: 'installation_required' }, 409);
      }
      if (error instanceof ConnectError &&
          (error.status === 404 || error.status === 403)) {
        return json({ connector, error: 'connector_not_configured' }, 503);
      }
      // SDK messages/vendor payloads can carry sensitive upstream details.
      return json({ connector, error: 'provider_unavailable' }, 502);
    }
  };
}

export const handleConnect = createConnectHandler({
  authenticate,
  getToken,
  startAuthorization,
  snowflakeSubject: () => process.env.CONNECT_SNOWFLAKE_SUBJECT,
});
