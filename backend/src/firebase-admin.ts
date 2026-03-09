import * as admin from "firebase-admin";
import serviceAccount from "../firebase-private.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const messaging = admin.messaging();

export { messaging };
