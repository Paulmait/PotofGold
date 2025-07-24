import { getAuth } from 'firebase/auth';
import app from './firebase';

// Initialize Firebase Auth
export const auth = getAuth(app);

export default auth; 