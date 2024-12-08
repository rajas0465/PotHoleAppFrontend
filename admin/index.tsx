import React, { useContext, useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext"; // Use AuthContext for authentication and WebSocket alerts

interface AlertType {
  report_id: string;
  description: string;
  latitude: number;
  longitude: number;
  severity_level: string;
}



export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useContext(AuthContext) || { user: null, alerts: [] as AlertType[] }; // Ensure type safety
  const [latestAlerts, setLatestAlerts] = useState<AlertType[]>([]); // Specify the type here


  const handleAlertClick = (alert: AlertType) => {
    Alert.alert(
      "New Alert",
      `Report ID: ${alert.report_id}\nDescription: ${alert.description}\nSeverity: ${alert.severity_level}`,
      [{ text: "View Details", onPress: () => router.push("./admin/report-details") }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {user && user.role === "admin" ? (
        <>
          <Button title="View Map" onPress={() => router.push("./admin/map-view")} />
          <Button title="View Reports" onPress={() => router.push("./admin/report-details")} />

          {/* <Text style={styles.alertTitle}>Recent Alerts</Text> */}
          <FlatList
            data={latestAlerts}
            keyExtractor={(item, index) => `${item.report_id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.alertItem}>
                <Text style={styles.alertText}>
                  {`Report ID: ${item.report_id} - Severity: ${item.severity_level}`}
                </Text>
                <Button title="Details" onPress={() => handleAlertClick(item)} />
              </View>
            )}
          />
        </>
      ) : (
        <Text style={styles.errorText}>You are not authorized to view this page.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  alertItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: "100%",
  },
  alertText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});
