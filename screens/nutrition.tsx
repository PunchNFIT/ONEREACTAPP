import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { FileText } from "@expo/vector-icons";
import { format } from "date-fns";
import type { FoodLog, MealPlan } from "../shared/schema";
import { FileUpload } from "../components/ui/FileUpload";
import { validateFile, uploadFile } from "../lib/upload-helpers";
import * as WebBrowser from 'expo-web-browser';

export default function Nutrition() {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const { data: foodLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["/api/food-logs"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/food-logs");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Request failed with status ${res.status}: ${res.statusText}`,
          );
        }
        const data = await res.json();
        return data;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch food logs",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const { data: mealPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/meal-plans"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/meal-plans");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch meal plans: ${response.status}`);
      }
      const result = await response.json();
      return result;
    },
  });

  const cleanupMealPlansMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cleanup-meal-plans");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cleanup meal plans");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Complete",
        description: `Removed ${data.deletedCount} duplicate meal plans`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadFoodLogMutation = useMutation({
    mutationFn: async (fileData: { file: any; notes: string }) => {
      const { file, notes } = fileData;

      if (!file) {
        throw new Error("No file provided for upload");
      }

      const allowedTypes = [".pdf", ".png", ".jpeg", ".jpg"];
      const { valid, error } = validateFile(
        file,
        allowedTypes,
        5 * 1024 * 1024,
      );

      if (!valid) {
        throw new Error(error);
      }

      const additionalData: Record<string, string> = {};
      if (notes) {
        additionalData.notes = notes;
      }

      return uploadFile("/api/food-logs", file, additionalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-logs"] });
      toast({
        title: "Success",
        description: "Food log uploaded successfully",
      });
      setNotes("");
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload food log",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Upload Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadFoodLogMutation.mutateAsync({ file: selectedFile, notes });
    } catch (error) {
      // Error will be handled by mutation's onError callback
    }
  };

  if (isLoadingLogs || isLoadingPlans) {
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
        <Text style={styles.title}>Nutrition</Text>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Upload Food Log</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.formGroup}>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.png,.jpeg,.jpg"
                  label="Choose food log file"
                  allowedTypes={[".pdf", ".png", ".jpeg", ".jpg"]}
                  maxSize={5 * 1024 * 1024} // 5MB
                />
                <Textarea
                  placeholder="Add notes about your food log..."
                  value={notes}
                  onChangeText={setNotes}
                  editable={!uploadFoodLogMutation.isPending}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleUpload}
                  disabled={!selectedFile || uploadFoodLogMutation.isPending}
                >
                  {uploadFoodLogMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.uploadButtonText}>Upload Food Log</Text>
                  )}
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderContent}>
                <CardTitle>Your Meal Plans</CardTitle>
                {mealPlans?.plans?.length > 1 && (
                  <TouchableOpacity
                    onPress={() => cleanupMealPlansMutation.mutate()}
                    disabled={cleanupMealPlansMutation.isPending}
                    style={styles.cleanupButton}
                  >
                    {cleanupMealPlansMutation.isPending ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <Text style={styles.cleanupButtonText}>Remove Duplicates</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.mealPlansContainer}>
                {mealPlans?.plans?.length ? (
                  mealPlans.plans.map((plan: any, idx: number) => (
                    <View
                      key={plan.id || idx}
                      style={styles.mealPlanItem}
                    >
                      <View style={styles.mealPlanContent}>
                        <Text style={styles.mealPlanTitle}>{plan.title || "AI Generated Meal Plan"}</Text>
                        {plan.description && (
                          <Text style={styles.mealPlanDescription}>
                            {plan.description}
                          </Text>
                        )}
                        <Text style={styles.mealPlanDate}>
                          Created on {format(new Date(plan.createdAt || plan.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => WebBrowser.openBrowserAsync(plan.url || plan.filePath)}
                        style={styles.downloadButton}
                      >
                        <FileText size={16} color="white" />
                        <Text style={styles.downloadButtonText}>Download Meal Plan</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <FileText size={48} color="gray" style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateText}>
                      No meal plans assigned yet
                    </Text>
                    <Text style={styles.emptyStateSubText}>
                      Your AI Agent will generate and save them here automatically
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          <Card style={styles.fullWidthCard}>
            <CardHeader>
              <CardTitle>Food Log History</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.foodLogsContainer}>
                {foodLogs?.length ? (
                  foodLogs.map((log: FoodLog) => (
                    <View
                      key={log.id}
                      style={styles.foodLogItem}
                    >
                      <View>
                        <Text style={styles.foodLogDate}>
                          {format(new Date(log.uploadedAt), "MMM d, yyyy")}
                        </Text>
                        {log.notes && <Text style={styles.foodLogNotes}>{log.notes}</Text>}
                        <TouchableOpacity
                          onPress={() => WebBrowser.openBrowserAsync(log.filePath)}
                          style={styles.viewLogButton}
                        >
                          <FileText size={16} color="blue" />
                          <Text style={styles.viewLogButtonText}>View Log</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyStateText}>
                    No food logs uploaded yet
                  </Text>
                )}
              </View>
            </CardContent>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  fullWidthCard: {
    width: "100%",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  cardHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  cleanupButton: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  cleanupButtonText: {
    fontSize: 12,
    color: "black",
  },
  mealPlansContainer: {
    marginTop: 10,
  },
  mealPlanItem: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  mealPlanContent: {
    marginBottom: 10,
  },
  mealPlanTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  mealPlanDescription: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  mealPlanDate: {
    fontSize: 10,
    color: "gray",
    marginTop: 5,
  },
  downloadButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  downloadButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 20,
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
  foodLogsContainer: {
    marginTop: 10,
  },
  foodLogItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 10,
    marginBottom: 10,
  },
  foodLogDate: {
    fontSize: 12,
    color: "gray",
  },
  foodLogNotes: {
    marginTop: 5,
  },
  viewLogButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  viewLogButtonText: {
    color: "blue",
    textDecorationLine: "underline",
  },
});
