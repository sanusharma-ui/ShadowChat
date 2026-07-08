const admin = require("firebase-admin");
const env = require("./env");

let initialized = false;

function getCredential() {
  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey
    });
  }
  return admin.credential.applicationDefault();
}

function initializeFirebase() {
  if (initialized) return admin.app();

  admin.initializeApp({
    credential: getCredential(),
    projectId: env.firebaseProjectId || undefined
  });

  initialized = true;
  return admin.app();
}

function getAuth() {
  initializeFirebase();
  return admin.auth();
}

module.exports = {
  admin,
  initializeFirebase,
  getAuth
};
