'use client';

import SignIn from "./signIn";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import { User } from "firebase/auth";
import Image from "next/image";
import Upload from "./upload";

function NavBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="backdrop-blur-md bg-gray-900/80 border-b border-gray-800 px-8 py-5 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative overflow-hidden rounded-lg transform transition-all duration-300 hover:scale-105">
            <Image 
              width={64} 
              height={64}
              src="/playbox-removebg-preview.png" 
              alt="Logo"
              className="object-contain"
            />
          </div>
        </Link>
        
        <div className="flex items-center space-x-6">
          {user && <Upload />}
          <SignIn user={user} />
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
