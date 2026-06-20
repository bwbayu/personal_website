// Augment Express's Request with the verified admin identity. The auth
// middleware sets `adminEmail` on the Firebase-token path so downstream
// handlers (and later admin features) can read who is making the write.
declare global {
  namespace Express {
    interface Request {
      adminEmail?: string;
    }
  }
}

export {};
