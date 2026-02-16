import 'dotenv/config';

console.log("API_KEY:", process.env.VITE_FIREBASE_API_KEY ? process.env.VITE_FIREBASE_API_KEY.substring(0, 5) + "..." : "UNDEFINED");
console.log("PROJECT_ID:", `"${process.env.VITE_FIREBASE_PROJECT_ID}"`);
console.log("AUTH_DOMAIN:", process.env.VITE_FIREBASE_AUTH_DOMAIN);
