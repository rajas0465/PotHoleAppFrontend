import { Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import { Button, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <HeaderWithRoleRedirect />
    </AuthProvider>
  );
}

function HeaderWithRoleRedirect() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { logout, user } = authContext;
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Manage loading state

  // Role-based redirection logic
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.replace("/admin"); // Redirect to admin page
      } else {
        router.replace("/user"); // Redirect to user page
      }
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true); // Set loading state to true
    await logout(); // Clear user session
    setIsLoggingOut(false); // Set loading state to false
    router.push("/"); // Navigate to login screen
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true, // Enable header by default
        headerRight: () => (
          isLoggingOut ? ( // Check if logging out
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            user && (
              <Button
                title="Logout"
                onPress={handleLogout}                
              />
            )
          )
        ),
        headerStyle: {
          backgroundColor: "#6200ee", // Header background color
        },
        headerTintColor: "#fff", // Header text color
      }}
    >
      {/* Screens where the header is hidden */}
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />

      {/* Screens where the header with Logout is shown */}
      <Stack.Screen name="user/index" />
      <Stack.Screen name="admin/index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    color: "#ff6347", // Customize the Logout button color
  },
});
