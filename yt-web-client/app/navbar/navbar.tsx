'use client';

import SignIn from "./signIn";
import Link from "next/link";

import styles from "./navbar.module.css";
import { useEffect, useState } from "react";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import { User } from "firebase/auth";
import Image from "next/image";
import Upload from "./upload";


function NavBar() {
  // Initialize user state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [] /* No dependencies, never rerun */);


  return (
    <nav className={styles.nav}>
      <Link href="/">
        <Image width={90} height={90}
          src="/playbox.png" alt="PlayBox Logo"/>
      </Link>
      { 
        user && <Upload />
      }
      <SignIn user={user} />
    </nav>
  );
  
}

export default NavBar;


