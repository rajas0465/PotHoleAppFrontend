import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";

interface AlertData {
  alert_id: number;
  report_id: number;
  alert_status: string;
  alert_timestamp: string;
  image_url: string;
  description: string;
  latitude: number;
  longitude: number;
  severity_level: string;
  report_status: string;
}

const BASE_URL = 'http://192.168.29.209:3000';

export default function ReportDetailsScreen() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // For first-time loading
  const [isPolling, setIsPolling] = useState<boolean>(false); // For polling status
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { user } = authContext;

  const fetchAlerts = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await axios.get(`${BASE_URL}/admin-alerts`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const { alerts } = response.data;

      const sortedAlerts = alerts.sort((a: AlertData, b: AlertData) => {
        if (a.alert_status === "Unread" && b.alert_status !== "Unread") return -1;
        if (a.alert_status !== "Unread" && b.alert_status === "Unread") return 1;
        return 0;
      });
      setAlerts(sortedAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      Alert.alert("Error", "Could not fetch alerts. Please try again.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (!isPolling) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchAlerts(); // Fetch alerts without showing loading
      }, 10000); // Poll every 10 seconds

      // Cleanup the interval on component unmount
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  };

  const markAlertAsRead = async (alert_id: number) => {
    try {
      await axios.patch(
        `${BASE_URL}/alerts/${alert_id}`,
        { alert_status: "Read" },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      Alert.alert("Success", "Alert marked as read.");
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.alert_id === alert_id ? { ...alert, alert_status: "Read" } : alert
        )
      );
    } catch (error) {
      console.error("Error updating alert status:", error);
      Alert.alert("Error", "Could not update alert status. Please try again.");
    }
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => console.error("Error opening URL:", err));
  };

  useEffect(() => {
    // Fetch alerts initially
    fetchAlerts(true);

    // Start polling
    const stopPolling = startPolling();

    // Cleanup polling when the component unmounts
    return () => {
      if (stopPolling) stopPolling();
    };
  }, []);

  const renderAlert = ({ item }: { item: AlertData }) => (
    <View style={styles.alertContainer}>
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.details}>Severity: {item.severity_level}</Text>
      <Text style={styles.details}>Report Status: {item.report_status}</Text>
      <Text style={styles.details}>Alert Status: {item.alert_status}</Text>
      <Text style={styles.details}>Timestamp: {item.alert_timestamp}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => openLocation(item.latitude, item.longitude)}
      >
        <Text style={styles.buttonText}>View Location</Text>
      </TouchableOpacity>
      {item.alert_status === "Unread" ? (
        <Button
          title="Mark as Read"
          onPress={() => markAlertAsRead(item.alert_id)}
        />
      ) : (
        <Button title="Marked as Read" disabled />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Reports</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : alerts.length > 0 ? (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.alert_id.toString()}
          renderItem={renderAlert}
        />
      ) : (
        <Text style={styles.noReportsText}>No alerts found.</Text>
      )}
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
  alertContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  description: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noReportsText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
});
