import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext

const BASE_URL = 'http://192.168.29.209:3000';

type LocationData = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // Circle radius in kilometers
};

type AlertData = {
  alert_id: number;
  latitude: number;
  longitude: number;
  description: string;
  severity_level: string; // "High", "Medium", or "Low"
};

const App = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [adminAlerts, setAdminAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext is not available. Ensure you have wrapped the app in an AuthProvider.");
  }

  const { user } = authContext;

  useEffect(() => {
    if (!user || !user.userId) {
      Alert.alert("Error", "User is not authenticated");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching location data...");
        const locationResponse = await axios.get<LocationData>(
          `${BASE_URL}/user/${user.userId}/location`
        );
        console.log("Location Data:", locationResponse.data);
        setLocationData(locationResponse.data);

        console.log("Fetching admin alerts...");
        const alertsResponse = await axios.get<{ alerts: AlertData[]; message: string }>(
          `${BASE_URL}/admin-alerts-get-locations`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`, // Assuming token-based authentication
            },
          }
        );
        console.log("Admin Alerts Data:", alertsResponse.data);
        setAdminAlerts(alertsResponse.data.alerts || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!locationData) {
    Alert.alert("Error", "No location data available", [{ text: "OK" }], { cancelable: false });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { latitude, longitude, radius, name } = locationData;

  console.log("Rendering map with location data:", { latitude, longitude, radius, name });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider="google"
        initialRegion={{
          latitude: latitude || 0,
          longitude: longitude || 0,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* User's Location Marker and Circle */}
        {latitude && longitude && radius ? (
          <>
            <Marker
              coordinate={{ latitude, longitude }}
              title={name}
              description={`Radius: ${radius} km`}
              pinColor="blue"
            />
            <Circle
              center={{ latitude, longitude }}
              radius={radius * 1000} // Convert km to meters
              strokeWidth={5}
              strokeColor="rgba(0, 0, 255, 1)" // Blue border
              fillColor="rgba(0, 0, 255, 0.2)" // Semi-transparent blue fill
            />
          </>
        ) : (
          <></> // Return empty fragment if conditions are not met
        )}

        {/* Admin Alerts Markers */}
        {adminAlerts && adminAlerts.length > 0 ? (
          
          adminAlerts.map((alert) => (
            <Marker
              key={alert.alert_id}
              coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
              title={alert.description}
              description={`Severity: ${alert.severity_level}`}
              pinColor={
                alert.severity_level.toLowerCase() === "high"
                  ? "red"
                  : alert.severity_level.toLowerCase() === "medium"
                  ? "orange"
                  : "green"
              }
            />
          ))
        ) : (
          <></> // Return empty fragment if no alerts are present
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
