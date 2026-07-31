import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { CREATE_USER, GET_USER, UPDATE_USER } from '@/graphql/queries';

export type GoalStatus = 'active' | 'completed' | 'deleted' | 'inactive';
export type Note = { id: number; content: string; createdAt: Date; updatedAt: Date; authorId?: number };
export type Goal = { id: number; content: string; status: GoalStatus; createdAt: Date; dueDate?: Date; updatedAt: Date; userId?: number };

export interface AppUser {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  feeling: string | null;
  notes: Array<Note>;
  goals: Array<Goal>;
  createdAt: Date;
  updatedAt: Date;
}

interface UserContextValue {
  appUser: AppUser | null;
  loading: boolean;
  errorMessage: string | null;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  appUser: null,
  loading: false,
  errorMessage: null,
  refetchUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fetchUser, { loading, refetch }] = useLazyQuery(GET_USER);
  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const firstName = clerkUser?.firstName;
  const lastName = clerkUser?.lastName;

  const updateAndFetchData = async () => {
      if (isSignedIn && clerkUser && primaryEmail) {
        const { data, error } = await fetchUser({ variables: { email: appUser?.email || primaryEmail } });
        if (error) {
          setErrorMessage(error.message ?? 'Failed to load user.');
          return;
        }

        let user = data?.user ?? null;

        if (!user) {
          // First sign-in: no backend user exists yet, so create one.
          await createUser({
            variables: {
              email: primaryEmail,
              username: clerkUser.username ?? '',
            },
          });
          const { data: refetchedData, error: refetchError } = await fetchUser({
            variables: { email: primaryEmail },
          });
          if (refetchError) {
            setErrorMessage(refetchError.message ?? 'Failed to load user.');
            return;
          }
          user = refetchedData?.user ?? null;
        } else {
          await updateUser({
            variables: {
              id: user.id,
              email: primaryEmail,
              firstName: firstName ?? '',
              lastName: lastName ?? '',
              username: clerkUser.username ?? '',
            },
          });
        }

        if (user) {
          console.log('Fetched user data:', user);
          setAppUser(user);
          setErrorMessage(null);
        } else {
          setErrorMessage('User not found.');
        }
      } else if (!isSignedIn) {
        setAppUser(null);
        setErrorMessage(null);
      }
    };
  
  const refetchUser = async () => {
    const { data, error: refetchError } = await refetch();
    if (data?.user) {
      console.log('Refetched user data:', data.user);
      setAppUser(data.user); 
    } 
    if (refetchError) {
      setErrorMessage(refetchError.message ?? 'Failed to load user.');
    }
  };

  useEffect(() => {
    updateAndFetchData();
  }, [isSignedIn, clerkUser]);

  return (
    <UserContext.Provider value={{ appUser, loading, errorMessage, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser(): UserContextValue {
  return useContext(UserContext);
}
