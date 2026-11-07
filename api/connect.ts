import { handleConnect } from '../server/connect.js';

// A Vercel Node function, separate from Vite's public client bundle.
export default { fetch: handleConnect };
