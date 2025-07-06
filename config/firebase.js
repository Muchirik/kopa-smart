const admin = require ('firebase-admin');

console.log("Loading Firebase service from:", process.env.FIREBASE_SERVICE_ACCOUNT);

const serviceAccount = require (process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const db = admin.firestore();
module.exports = db;