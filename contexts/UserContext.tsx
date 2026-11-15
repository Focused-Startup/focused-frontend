import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { CREATE_USER, ENSURE_CANVAS, GET_USER, UPDATE_USER } from '@/graphql/queries';

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
  canvasError: string | null;
  canvasReady: boolean;
  retryCanvas: () => void;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  appUser: null,
  loading: false,
  errorMessage: null,
  canvasError: null,
  canvasReady: false,
  retryCanvas: () => {},
  refetchUser: () => {}
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRequestRef = useRef(0);
  const syncedClerkUserIdRef = useRef<string | null>(null);

  const [fetchUser, { loading, refetch }] = useLazyQuery(GET_USER, { fetchPolicy: 'network-only' });
  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [ensureCanvas] = useMutation(ENSURE_CANVAS);
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const firstName = clerkUser?.firstName;
  const lastName = clerkUser?.lastName;

  const ensureUserCanvas = async (ownerId: number) => {
    const requestId = ++canvasRequestRef.current;
    try {
      const { data } = await ensureCanvas({ variables: { ownerId } });
      if (!data?.ensureCanvas) throw new Error('Canvas provisioning returned no canvas.');
      if (requestId === canvasRequestRef.current) {
        setCanvasError(null);
        setCanvasReady(true);
      }
    } catch (error) {
      console.error('Failed to provision canvas:', error);
      if (requestId === canvasRequestRef.current) {
        setCanvasReady(false);
        setCanvasError('Could not set up your canvas.');
      }
    }
  };

  const retryCanvas = () => {
    if (appUser) void ensureUserCanvas(appUser.id);
  };

  const updateAndFetchData = async (isCurrent: () => boolean) => {
    try {
      if (isSignedIn && clerkUser && primaryEmail) {
        const sameAccount = syncedClerkUserIdRef.current === clerkUser.id;
        if (!sameAccount) {
          setAppUser(null);
          setCanvasError(null);
          setCanvasReady(false);
          syncedClerkUserIdRef.current = null;
        }
        const email = sameAccount ? appUser?.email || primaryEmail : primaryEmail;
        const { data, error: fetchError } = await fetchUser({ variables: { email } });
        if (!isCurrent()) return;
        if (fetchError) throw fetchError;

        let user = data?.user ?? null;

        if (!user) {
          // First sign-in: no backend user exists yet, so create one.
          const { error: createError } = await createUser({
            variables: {
              email: primaryEmail,
              username: clerkUser.username ?? '',
            },
          });
          if (!isCurrent()) return;
          if (createError) {
            setErrorMessage(createError.message ?? 'Failed to create user.');
            return;
          }
          const { data: refetchedData, error: refetchError } = await fetchUser({
            variables: { email: primaryEmail },
          });
          if (!isCurrent()) return;
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
          if (!isCurrent()) return;
        }

        if (user) {
          console.log('Fetched user data:', user);
          syncedClerkUserIdRef.current = clerkUser.id;
          setAppUser(user);
          setErrorMessage(null);
          await ensureUserCanvas(user.id);
        } else {
          setErrorMessage('User not found.');
        }
      } else if (!isSignedIn) {
        canvasRequestRef.current += 1;
        syncedClerkUserIdRef.current = null;
        setAppUser(null);
        setErrorMessage(null);
        setCanvasError(null);
        setCanvasReady(false);
      }
    } catch (error: any) {
      if (isCurrent()) setErrorMessage(error.message ?? 'Failed to load user.');
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
    let active = true;
    void updateAndFetchData(() => active);
    return () => {
      active = false;
      canvasRequestRef.current += 1;
    };
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
        canvasError,
        canvasReady,
        retryCanvas,
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
