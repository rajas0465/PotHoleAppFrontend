import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext'; // Ensure this is the correct path to your AuthContext

const BASE_URL = 'http://192.168.29.209:3000';

export default function ReportSubmission() {
  const [description, setDescription] = useState<string>(''); // Description field
  const [image, setImage] = useState<string | null>(null); // Image URI
  const [location, setLocation] = useState<Location.LocationObject | null>(null); // User's location
  const [severityLevel, setSeverityLevel] = useState<string>('low'); // Severity level
  const [loading, setLoading] = useState<boolean>(false);

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user } = authContext;

  // Handle image picking
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri); // Set selected image URI
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick the image. Please try again.');
    }
  };

  // Get user location
  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to submit the report.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      Alert.alert("Location Acquired", "Your location has been captured successfully.");
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not fetch location. Please try again.');
    }
  };

  // Submit the report
  const handleSubmit = async () => {
    if (!description || !image || !location) {
      Alert.alert('Missing Fields', 'Please fill all fields and select an image before submitting.');
      return;
    }

    try {
      setLoading(true);

      // Preparing the report data
      const reportData = {
        user_id: user?.userId, // Dynamic user ID from AuthContext
        image_url: image, // Map the image URI to image_url
        description, // Description provided by the user
        latitude: location.coords.latitude, // Current location latitude
        longitude: location.coords.longitude, // Current location longitude
        severity_level: severityLevel, // Severity level (e.g., low, medium, high)
      };

      // Sending the POST request
      const response = await axios.post(`${BASE_URL}/reports`, reportData, {
        headers: {
          Authorization: `Bearer ${user?.token}`, // Dynamic Bearer token
          'Content-Type': 'application/json',
        },
      });

      Alert.alert('Success', 'Your report has been submitted.');
      console.log('Response:', response.data);

      // Reset form state
      setDescription('');
      setImage(null);
      setLocation(null);
      setSeverityLevel('low');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Could not submit the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit a Pothole Report</Text>

      {/* Image Picker */}
      <Button title="Pick an Image" onPress={handlePickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}

      {/* Description Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter a brief description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
      />

      {/* Severity Level Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter severity level (low, medium, high)"
        placeholderTextColor="#888"
        value={severityLevel}
        onChangeText={setSeverityLevel}
      />

      {/* Get Location Button */}
      <Button title="Get Current Location" onPress={handleGetLocation} />

      {/* Display Location (Optional) */}
      {location && (
        <Text style={styles.locationText}>
          Latitude: {location.coords.latitude}, Longitude: {location.coords.longitude}
        </Text>
      )}

      {/* Submit Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Submit Report" onPress={handleSubmit} color="blue" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },
  locationText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
