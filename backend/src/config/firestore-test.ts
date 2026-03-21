import { Firestore } from '@google-cloud/firestore';

const DATABASE_ID = 'personal-website-data';

async function testFirestore() {
  const db = new Firestore({ databaseId: DATABASE_ID });

  const projectId =
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    '(auto-detected from ADC)';

  console.log('--- Firestore Diagnostic ---');
  console.log(`Project ID : ${projectId}`);
  console.log(`Database ID: ${DATABASE_ID}`);
  console.log('');

  try {
    console.log("Attempting to read 'skills' collection...");
    const snapshot = await db.collection('skills').limit(1).get();
    console.log(`SUCCESS - Connected to Firestore.`);
    console.log(`Documents in 'skills': ${snapshot.size}`);
  } catch (err: any) {
    const code: number = err?.code;

    console.error(`FAILED - gRPC code: ${code}`);
    console.error('');

    if (code === 16) {
      console.error('DIAGNOSIS: UNAUTHENTICATED');
      console.error('  gcloud ADC credentials are missing or expired.');
      console.error('  Fix: run  gcloud auth application-default login');
    } else if (code === 7) {
      console.error('DIAGNOSIS: PERMISSION_DENIED');
      console.error('  Your gcloud account lacks the Firestore IAM role.');
      console.error('  Fix: go to GCP IAM and grant "Cloud Datastore User" or "Firebase Admin" role to your account.');
    } else if (code === 5) {
      console.error('DIAGNOSIS: NOT_FOUND');
      console.error(`  Firestore database '${DATABASE_ID}' was not found in the current project.`);
      console.error('  Possible causes:');
      console.error('    1. Wrong project ID — check that the gcloud project matches your Firebase project.');
      console.error(`       Run: gcloud config get-value project`);
      console.error(`    2. Database name mismatch — confirm the database is named exactly '${DATABASE_ID}' in Firebase Console.`);
      console.error('    3. Firestore not enabled — go to Firebase Console > Firestore Database and create the database.');
    } else {
      console.error('DIAGNOSIS: Unexpected error');
      console.error(err.message ?? err);
    }
  }
}

testFirestore();
