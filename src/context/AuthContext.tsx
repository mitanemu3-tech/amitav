import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../firebase/config';
import { UserRole, Teacher } from '../types';
import { schoolService } from '../services/schoolService';

interface AuthContextType {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    teacherId: string;
  };
  currentTeacher: Teacher | undefined;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchActiveRole: (role: UserRole, teacherId?: string) => void;
  allTeachers: Teacher[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(schoolService.getTeachers());
  
  // Default to Headmaster Dr. Prasanta Roy for instant administrative access
  const defaultTeacher = teachers.find((t) => t.role === 'HM') || teachers[0];
  
  const [activeUser, setActiveUser] = useState({
    uid: defaultTeacher.teacherId,
    email: defaultTeacher.email,
    displayName: defaultTeacher.name,
    role: defaultTeacher.role,
    teacherId: defaultTeacher.teacherId,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubSchool = schoolService.subscribe(() => {
      setTeachers([...schoolService.getTeachers()]);
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Check if user is known teacher by email or bootstrapped admin
        const match = schoolService.getTeachers().find(
          (t) => t.email.toLowerCase() === user.email?.toLowerCase()
        );

        if (user.email === 'mitanemu3@gmail.com') {
          // Bootstrapped HM
          setActiveUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Administrator (HM)',
            role: 'HM',
            teacherId: match?.teacherId || 'T-001',
          });
        } else if (match) {
          setActiveUser({
            uid: user.uid,
            email: user.email || match.email,
            displayName: user.displayName || match.name,
            role: match.role,
            teacherId: match.teacherId,
          });
        } else {
          // Default new teacher account
          setActiveUser({
            uid: user.uid,
            email: user.email || 'teacher@school.edu',
            displayName: user.displayName || 'Teacher',
            role: 'AT',
            teacherId: 'T-003',
          });
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubSchool();
      unsubAuth();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      const hm = teachers.find((t) => t.role === 'HM') || teachers[0];
      setActiveUser({
        uid: hm.teacherId,
        email: hm.email,
        displayName: hm.name,
        role: hm.role,
        teacherId: hm.teacherId,
      });
    } catch (err) {
      console.error('Sign Out failed:', err);
    }
  };

  const switchActiveRole = (role: UserRole, targetTeacherId?: string) => {
    const matched = targetTeacherId
      ? teachers.find((t) => t.teacherId === targetTeacherId)
      : teachers.find((t) => t.role === role);

    if (matched) {
      setActiveUser({
        uid: matched.teacherId,
        email: matched.email,
        displayName: matched.name,
        role: matched.role,
        teacherId: matched.teacherId,
      });
    } else {
      setActiveUser((prev) => ({
        ...prev,
        role,
      }));
    }
  };

  const currentTeacher = teachers.find((t) => t.teacherId === activeUser.teacherId);

  return (
    <AuthContext.Provider
      value={{
        currentUser: activeUser,
        currentTeacher,
        firebaseUser,
        isLoading,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
        switchActiveRole,
        allTeachers: teachers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
