# Vercel Connect: server-only integration

This branch is based on the production revision 1777e0e. No public page, image,
style, contact link, navigation, Firebase client flow or DNS setting is changed.
The server API is a foundation for authorized integrations, not a new public UI
and not a claim that provider operations have passed end-to-end tests.

## Registered connectors

| UID | Method | Required identity/setup |
| --- | --- | --- |
| notion/acme-notion | Notion MCP OAuth | Each Firebase user must consent with their own Notion account. This is **not** a Notion REST API integration. |
| airefs/acme-airefs | MCP OAuth | Each Firebase user must consent with their own Airefs account. |
| adobe/acme-adobe | Adobe Express MCP OAuth | Each Firebase user must consent with their own Adobe account. |
| snowflake/acme-snowflake | Workload Identity Federation | Configure the actual Snowflake account, federation trust and service subject before requesting credentials. No warehouse was provisioned. |

The connectors are attached to `remix-proyecto-taller` for Preview and Production.
Attachment does not grant provider access. Those environments share provider
grants; create separate connectors if provider-level staging isolation is needed.

## API

Send the existing Firebase client's **ID token** in `Authorization: Bearer ...`
over HTTPS. Do not send a Google OAuth access token. The server verifies the
signature against Google's keys, Firebase project audience/issuer, expiration,
issued-at, authentication time and subject. It derives the UID from the verified
identity, never from a query string or request body. The verifier does not check
Firebase account disablement/token revocation; already-issued ID tokens remain
valid until expiry. No Firebase service-account key is required for this JWT
verification flow.

- `GET /api/connect?provider=notion` (or `airefs`, `adobe`, `snowflake`): requests
  a short-lived credential **only on the server** and returns sanitized status.
  `credential_available` means minting worked, not that a provider API operation
  was tested. Provider tokens are never returned.
- `POST /api/connect?provider=notion` (or `airefs`, `adobe`): starts that verified
  user's consent flow and returns only `authorizationUrl`. Open that URL, complete
  consent, then retry GET with the **same** Firebase account. Vercel handles the
  provider handshake. The endpoint does not accept an arbitrary callback URL.
- Snowflake has no per-user consent endpoint. Its shared credential check is
  limited to the existing workshop administrator's verified email, matching the
  existing client admin policy. Do not enable this account-wide credential for
  arbitrary authenticated users.

Responses are private/no-store. Missing identity is 401, forbidden shared access
403, unsupported provider 400, consent/installation needed 409, missing connector
configuration 503, and upstream failures 502. No raw SDK messages or payloads are
logged or returned. No cookie authentication or permissive CORS is introduced.
These endpoints do not read/write provider content or run warehouse queries.
Before adding such an operation, define the intended action and minimal provider
permissions; do not build an arbitrary URL/token proxy.

## Environment configuration

- `VERCEL_OIDC_TOKEN`: provided automatically by the deployed Vercel runtime.
  Do not manually copy, persist or commit it.
- `CONNECT_SNOWFLAKE_SUBJECT`: **not configured yet**. Set the real federated
  subject in Preview/Production only after the Snowflake administrator has
  completed trust and account setup for this connector. This is server-only
  configuration; never use a `VITE_` prefix. Do not guess a subject or use
  `user_123`. Configure any connector-specific account settings in Connect.

There are no provider keys in project environment variables. No provider secrets
were added to this repository. OAuth credentials and grants belong in Connect.
If the provider requires a secret, the owner must enter it directly in the
provider/Connect interface, not in chat.

## Verification and release gate

Run `npm run test:connect`, `npm run lint`, `npm run build`, and `npm audit`.
Tests use local RSA keys and dependency-injected mock providers; they are not
real provider authorizations. Vite's frontend build does not exercise the Node
function: verify `/api/connect?provider=notion` independently on the deployed
preview and expect 401 while signed out.

On the READY preview, check the homepage at phone/desktop sizes, the 11-photo
album, contact navigation and the signed-out Workspace modal. Then the owner
must sign into the existing Firebase app, authorize each OAuth connector and
confirm the credential check with the same UID. Configure and test Snowflake
with its administrator. Repeat authorized tests in production only after the
preview gate passes. Saving quotes, private Gmail/Forms/Tasks data, actual
provider operations and consent cannot be claimed verified without these steps.
Do not promote this branch until those tests and the desired provider operations
are agreed. Preserve the existing production domain and apex-to-www 308 redirect.
