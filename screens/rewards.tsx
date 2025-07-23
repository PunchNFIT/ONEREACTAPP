import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { RewardDashboard } from "../components/viift/RewardDashboard";
import { useAuth } from "../hooks/use-auth";

export default function Rewards() {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView style={styles.mainContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>VII-FT Rewards</Text>
          <Text style={styles.subtitle}>
            Earn VII-FT tokens by achieving your fitness goals and claim them on the XRP Ledger
          </Text>
        </View>
        
        <RewardDashboard userId={user.id.toString()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
  },
  mainContent: {
    flex: 1,
    padding: 16,
    marginLeft: 64, // Adjust based on sidebar width
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
  },
});
