import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { CREATE_USER, GET_USER, UPDATE_USER } from '@/graphql/queries';

export type GoalStatus = 'active' | 'completed' | 'deleted' | 'inactive';
export type Note = { id: number; content: string; createdAt: Date; updatedAt: Date; authorId?: number };
export type Goal = { id: number; content: string; status: GoalStatus; createdAt: Date; dueDate?: Date; updatedAt: Date; userId?: number };
export type Response = { id: number; authorId: number; authorName: string; questionId: number; body: string; createdAt: Date; updatedAt: Date };
export type Question = {
  id: number;
  authorId: number;
  authorName?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  responses: Response[];
};

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
  questions: Array<Question>;
}

const SYNC_INTERVAL_MS = 60 * 1000;

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
  refetchUser: () => {}
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
    try {
      if (isSignedIn && clerkUser && primaryEmail) {
        const { data } = await fetchUser({ variables: { email: appUser?.email || primaryEmail } });

        let user = data?.user ?? null;

        if (!user) {
          // First sign-in: no backend user exists yet, so create one.
          const { error: createError } = await createUser({
            variables: {
              email: primaryEmail,
              username: clerkUser.username ?? '',
            },
          });
          if (createError) {
            setErrorMessage(createError.message ?? 'Failed to create user.');
            return;
          }
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
    } catch (error: any) {
      setErrorMessage(error.message ?? 'Failed to load user.');
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

  // Periodically sync with the backend so drift from local-only updates
  // (or changes made elsewhere) eventually gets reconciled.
  useEffect(() => {
    if (!isSignedIn) return;

    const intervalId = setInterval(() => {
      refetchUser();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isSignedIn]);

  return (
    <UserContext.Provider
      value={{
        appUser,
        loading,
        errorMessage,
        refetchUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser(): UserContextValue {
  return useContext(UserContext);
}
