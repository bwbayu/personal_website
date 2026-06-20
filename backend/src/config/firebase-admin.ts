import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { config } from './env';

// Initialize the Firebase Admin app exactly once. verifyIdToken only needs the
// project id (the token audience); ADC supplies credentials on Cloud Run, so no
// service-account key file is required. The getApps() guard makes repeated
// imports a no-op. Init does not throw when firebaseProjectId is undefined;
// failure (if any) surfaces only on an actual verify call.
if (getApps().length === 0) {
  initializeApp({ projectId: config.firebaseProjectId });
}

// Single mockable seam for ID-token verification. The auth middleware imports
// this function, and unit tests mock this module rather than the Admin SDK.
export function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth().verifyIdToken(token);
}
