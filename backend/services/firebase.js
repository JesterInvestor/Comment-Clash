const admin = require('firebase-admin');

let db = null;

function initializeFirebase() {
  try {
    // Initialize Firebase Admin SDK
    if (process.env.FIREBASE_PROJECT_ID) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      db = admin.firestore();
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase credentials not provided, running without Firestore');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
  }
}

async function saveGameToFirestore(roomCode, gameData) {
  if (!db) return;
  
  try {
    await db.collection('games').doc(roomCode).set({
      ...gameData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving game to Firestore:', error);
  }
}

async function getGameFromFirestore(roomCode) {
  if (!db) return null;
  
  try {
    const doc = await db.collection('games').doc(roomCode).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting game from Firestore:', error);
    return null;
  }
}

async function saveGameStats(gameData) {
  if (!db) return;
  
  try {
    await db.collection('stats').add({
      ...gameData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving game stats:', error);
  }
}

module.exports = {
  initializeFirebase,
  saveGameToFirestore,
  getGameFromFirestore,
  saveGameStats
};
