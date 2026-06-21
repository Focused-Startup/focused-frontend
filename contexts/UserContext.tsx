import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useLazyQuery } from '@apollo/client/react';
import { GET_USER } from '@/graphql/queries';

export interface AppUser {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserContextValue {
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const UserContext = createContext<UserContextValue>({
  appUser: null,
  loading: false,
  error: null,
  refetch: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fetchUser, { loading }] = useLazyQuery<{ user: AppUser | null }>(GET_USER);

  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;

  const refetch = () => {
    if (primaryEmail) {
      fetchUser({ variables: { email: primaryEmail } });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isSignedIn && primaryEmail) {
        const { data, error } = await fetchUser({ variables: { email: primaryEmail } });
        if (error) {
          setError(error.message ?? 'Failed to load user.');
          return;
        }
        if (data?.user) {
          setAppUser(data.user);
          setError(null);
        } else {
          setError('User not found.');
        }
      } else if (!isSignedIn) {
        setAppUser(null);
        setError(null);
      }
    };
    fetchData();
  }, [isSignedIn, primaryEmail]);

  return (
    <UserContext.Provider value={{ appUser, loading, error, refetch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser(): UserContextValue {
  return useContext(UserContext);
}
