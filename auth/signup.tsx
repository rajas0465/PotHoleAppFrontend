import { useState, useContext } from "react";
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker"; // Picker import
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext";


const BASE_URL = 'http://192.168.29.209:3000';

export default function SignupScreen() {
  const [name, setName] = useState(""); // Name field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role as 'user'
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongitude] = useState<string | null>(null);
  const [radius, setRadius] = useState<string>(""); // Radius for admin area
  const router = useRouter();

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { login } = authContext;

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      Alert.alert("Location Captured", "Your current location has been captured.");
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not fetch location. Please try again.");
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Fields", "Name, email, and password are required.");
      return;
    }

    if (role === "admin" && (!latitude || !longitude || !radius)) {
      Alert.alert("Missing Fields", "Please fill location and radius details for admin.");
      return;
    }

    try {
      let locationAreaId = null;

      // If the role is admin, create a geographical area first
      if (role === "admin") {
        const geoAreaResponse = await fetch(`${BASE_URL}/geographical-areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Admin Area for ${email}`, // Optional: Give a meaningful name
            latitude: parseFloat(latitude!),
            longitude: parseFloat(longitude!),
            radius: parseFloat(radius),
          }),
        });

        if (!geoAreaResponse.ok) {
          throw new Error("Failed to create geographical area. Please try again.");
        }

        const geoAreaData = await geoAreaResponse.json();
        locationAreaId = geoAreaData.id; // Capture the newly created area ID
      }

      // Now register the user
      const userResponse = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          location_area: locationAreaId, // Use the area ID for admin or null for user
        }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error("Failed to register. Please try again.");
      }else{
        Alert.alert("Error", userData.message || "Registration failed.");
      }

      
      //console.log(userData);
      if (userData.id && userData.token && userData.role) {
        // Save token, userId, and role in context
        //console.log("Registration successful, logging in.");
        login(userData.token, userData.id, userData.role);
  
      // Navigate based on role
      if (userData.role === "admin") {
        router.push("/admin"); // Admin-specific screen
      } else if (userData.role === "user") {
        router.push("/user"); // User-specific screen
      } else {
        router.push("/"); // Default home
      }
      } else {
        // If no token is provided, redirect to login screen
        //console.log("Registration successful but no token, redirecting to login.");
        Alert.alert("Success", "Account created successfully. Please log in.");
        router.push("/auth/login");
      
      }       
      
    } catch (error: any) {
      console.error("Error during signup:", error);
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Name Input */}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Role Dropdown */}
      <Text style={styles.label}>Select Role</Text>
      <Picker selectedValue={role} onValueChange={(itemValue) => setRole(itemValue)} style={styles.picker}>
        <Picker.Item label="User" value="user" />
        <Picker.Item label="Admin" value="admin" />
      </Picker>

      {/* Location Inputs (Only for Admin) */}
      {role === "admin" && (
        <>
          <Button title="Get Current Location" onPress={handleGetLocation} />
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            value={latitude || ""}
            onChangeText={setLatitude}
            style={styles.input}
            placeholder="Latitude"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            value={longitude || ""}
            onChangeText={setLongitude}
            style={styles.input}
            placeholder="Longitude"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Radius (in km)</Text>
          <TextInput
            value={radius}
            onChangeText={setRadius}
            style={styles.input}
            placeholder="Enter radius"
            placeholderTextColor="#888"
            keyboardType="numeric"
          />
        </>
      )}

      {/* Submit Button */}
      <Button title="Register" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  label: {
    color: "#fff",
    marginBottom: 8,
    fontSize: 16,
  },
  picker: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 16,
  },
});
