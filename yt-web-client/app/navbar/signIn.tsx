import { signInWithGoogle, signOut } from '../firebase/firebase';
import { User } from 'firebase/auth';


interface SignInProps {
  user: User | null;
}

export default function SignIn({ user }: SignInProps) {

  return (
    <div>
      {user ? (
        // If user is signed in, show a welcome message (or something else)
        <button className="inline-block border border-white/50 text-white py-2.5 px-5 rounded-full font-sans text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-white/10" onClick={signOut}>
          Sign Out
        </button>
      ) : (
        // If user is not signed in, show sign-in button
        <button className="inline-block border border-white/50 text-white py-2.5 px-5 rounded-full font-sans text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-white/10" onClick={signInWithGoogle}>
          Sign in
        </button>
      )}
    </div>
  );
}
