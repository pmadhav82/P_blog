const firebase = require("firebase-admin");
const serviceAccount = require("../service-account-key.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

module.exports = firebase;