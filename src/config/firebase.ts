import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

/*
 * Firebase project `qaryati-36f85`. This config is public by design (it only names the project); what each
 * visitor may read or write is decided by the security rules in firestore.rules.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDtpRazS3-om2ko67q7_uaf9jKBNSWrffE',
  authDomain: 'qaryati-36f85.firebaseapp.com',
  projectId: 'qaryati-36f85',
  storageBucket: 'qaryati-36f85.firebasestorage.app',
  messagingSenderId: '450593634584',
  appId: '1:450593634584:web:9ab69afc8ea641654b066d',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
/** Optional UI fields are `undefined` when empty; Firestore leaves them out instead of refusing the write. */
export const db = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true })
