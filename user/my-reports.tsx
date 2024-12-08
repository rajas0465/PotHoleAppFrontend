import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Linking, Alert, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext'; // Update the path to your AuthContext if necessary

interface Report {
  id: number;
  user_id: number;
  image_url: string;
  description: string;
  latitude: number;
  longitude: number;
  severity_level: string;
  status: string;
  created_at: string;
}

const BASE_URL = 'http://192.168.29.209:3000';

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]); // Array to store reports
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }

  const { user } = authContext;

  // Fetch reports from the API
  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${BASE_URL}/my-reports`, {
        headers: {
          Authorization: `Bearer ${user?.token}`, // Include Bearer token for authentication
        },
      });

      setReports(response.data); // Update the state with the fetched reports
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Could not fetch your reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(); // Fetch reports when the component mounts
  }, []);

  // Open location in maps
  const openLocationInMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open the location. Please try again.')
    );
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportContainer}>
      {/* Display the image if the image_url is available */}
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.details}>Severity: {item.severity_level}</Text>
      <Text style={styles.details}>Status: {item.status}</Text>
      <Text style={styles.details}>Created At: {item.created_at}</Text>
      <Button
        title="Open Location in Maps"
        onPress={() => openLocationInMaps(item.latitude, item.longitude)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Reports</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : reports.length > 0 ? (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReport}
        />
      ) : (
        <Text style={styles.noReportsText}>No reports found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  noReportsText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
