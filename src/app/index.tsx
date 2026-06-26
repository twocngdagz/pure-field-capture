import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.status}>Scaffold ready</Text>
      <Text style={styles.detail}>Milestone 2 in progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  status: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  detail: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
