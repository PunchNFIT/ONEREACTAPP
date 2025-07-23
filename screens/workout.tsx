import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, CalendarDays, Dumbbell } from "@expo/vector-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Sidebar } from "../components/layout/Sidebar";
import { useAuth } from "../hooks/use-auth";
import * as WebBrowser from 'expo-web-browser';

type Plan = {
  id: string;
  title: string;
  url: string;
  description: string;
  createdAt: string;
};

export default function WorkoutPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["workout-plans", user?.id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await fetch("/api/workout-plans", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view workout plans");
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch workout plans: ${response.status}`);
      }

      const result = await response.json();
      return result;
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      if (error.message.includes("401") || error.message.includes("log in")) {
        return false;
      }
      return failureCount < 3;
    },
    refetchInterval: false,
    staleTime: 30000,
  });
  const plans = data?.plans || [];

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView style={styles.mainContent}>
        <Text style={styles.title}>Workout Planner</Text>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Dumbbell size={20} color="black" />
                <Text>Current Workout Plan</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {isLoading ? (
                <View style={styles.skeletonContainer}>
                  <Skeleton style={styles.skeletonLine} />
                  <Skeleton style={styles.skeletonLineHalf} />
                  <Skeleton style={styles.skeletonLine} />
                </View>
              ) : error ? (
                <Text style={styles.errorText}>Error loading your workout plan.</Text>
              ) : plans.length > 0 ? (
                <View style={styles.planContainer}>
                  {plans.slice(0, 1).map((plan, idx) => (
                    <View key={plan.id || idx} style={styles.planItem}>
                      <Dumbbell size={48} color="black" />
                      <View style={styles.planDetails}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        {plan.description && (
                          <Text style={styles.planDescription}>
                            {plan.description.length > 100
                              ? `${plan.description.substring(0, 100)}...`
                              : plan.description}
                          </Text>
                        )}
                        <Text style={styles.planDate}>
                          Created on {format(new Date(plan.createdAt), "PPP")}
                        </Text>
                      </View>
                      <Button
                        onPress={() => WebBrowser.openBrowserAsync(plan.url)}
                        style={styles.downloadButton}
                      >
                        <Download size={16} color="white" />
                        <Text style={styles.buttonText}>Download Workout Plan</Text>
                      </Button>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Dumbbell size={48} color="gray" style={styles.emptyStateIcon} />
                  <Text style={styles.emptyStateText}>No workout plans assigned yet.</Text>
                  <Text style={styles.emptyStateSubText}>
                    Your AI Agent will generate and upload them here.
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <CalendarDays size={20} color="black" />
                <Text>Progress Tracker</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.emptyStateContainer}>
                <CalendarDays size={48} color="gray" style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateText}>Track your workout progress over time.</Text>
                <Text style={styles.emptyStateSubText}>
                  Log your completed workouts and see your improvement.
                </Text>
              </View>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled style={styles.comingSoonButton}>
                <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
              </Button>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // Adjust as needed for spacing
    marginBottom: 16,
  },
  cardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    height: 192, // Equivalent to h-48
  },
  skeletonContainer: {
    width: "100%",
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    width: "100%",
  },
  skeletonLineHalf: {
    height: 16,
    width: "75%",
  },
  errorText: {
    color: "red",
  },
  planContainer: {
    width: "100%",
    alignItems: "center",
  },
  planItem: {
    alignItems: "center",
    gap: 12,
  },
  planDetails: {
    alignItems: "center",
  },
  planTitle: {
    fontWeight: "bold",
    fontSize: 18,
  },
  planDescription: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    maxWidth: 250,
  },
  planDate: {
    fontSize: 12,
    color: "gray",
  },
  downloadButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    color: "gray",
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
  },
  comingSoonButton: {
    width: "100%",
  },
  comingSoonButtonText: {
    color: "black",
  },
});
