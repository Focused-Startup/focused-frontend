import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { TouchableOpacity } from 'react-native'
import { ThemedText } from './ThemedText'

export const SignOutButton = ({ onSignOut }: { onSignOut?: () => void }) => {
    const { signOut } = useClerk()

    const handleSignOut = async () => {
    try {
      await signOut()
      onSignOut?.()
      Linking.openURL(Linking.createURL('/(auth)/sign-in'))
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <ThemedText>Sign out</ThemedText>
    </TouchableOpacity>
  )
}