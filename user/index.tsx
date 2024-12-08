import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function UserHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Home</Text>
      <Button title="Submit Report" onPress={() => router.push("./user/report-submission")} />
      <Button title="My Reports" onPress={() => router.push("./user/my-reports")} />
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
});
