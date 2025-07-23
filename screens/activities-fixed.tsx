import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image as RNImage,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { activitySchema, type ActivityFormData } from "../shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Image, Upload, Dumbbell } from "@expo/vector-icons";
import { Button } from "../components/ui/Button";
import { Sidebar } from "../components/layout/Sidebar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/Form";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Select, SelectItem } from "../components/ui/Select";
import { Calendar } from "react-native-calendars";
import { FileUpload } from "../components/ui/FileUpload";
import { uploadFile } from "../lib/upload-helpers";
import * as WebBrowser from 'expo-web-browser';

const activityTypes = [
  "PunchNFIT",
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Weight Training",
  "ONE's Workout Plan",
  "Yoga",
  "Pilates",
  "HIIT",
  "Other",
];

interface Activity {
  id: number;
  userId: number;
  date: string;
  activityType: string;
  description: string;
  filePath?: string;
  createdAt: string;
}

export default function Activities() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState("PunchNFIT");

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      activityType: "",
      description: "",
    },
  });

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    staleTime: 1000 * 60 * 5,
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { formData: FormData; file?: any }) => {
      const response = await apiRequest("POST", "/api/activities", data.formData, {
        isFormData: true,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add activity");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Activity added",
        description: "Your activity has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("date", data.date);
      formData.append("activityType", data.activityType);
      formData.append("description", data.description);

      if (selectedFile) {
        formData.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        } as any);
      }

      await addActivityMutation.mutateAsync({ formData, file: selectedFile });
    } catch (error) {
      console.error("Error uploading activity:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView style={styles.mainContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Activity Tracker</Text>
          <Text style={styles.subtitle}>
            Record your daily activities and track your fitness journey.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Add New Activity</CardTitle>
              <CardDescription>
                Log your activities with date, type, description and optional
                photo evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <View style={styles.formSpace}>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem style={styles.formItem}>
                        <FormLabel>Date</FormLabel>
                        <TouchableOpacity
                          onPress={() => { /* Open date picker */ }}
                          style={styles.datePickerButton}
                        >
                          <Text style={styles.datePickerButtonText}>
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Text>
                          <CalendarIcon size={16} color="black" />
                        </TouchableOpacity>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activityType"
                    render={({ field }) => (
                      <FormItem style={styles.formItem}>
                        <FormLabel>Activity Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          items={activityTypes.map(type => ({ label: type, value: type }))}
                          placeholder={{ label: "Select activity type", value: null }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem style={styles.formItem}>
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          placeholder="Describe your activity, including weights used for each exercise, duration, intensity and how you felt"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <View style={styles.photoEvidenceContainer}>
                    <FormLabel>Photo Evidence (Optional)</FormLabel>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                      label="Choose photo"
                      allowedTypes={["image/png", "image/jpeg", "image/jpg"]}
                      maxSize={5 * 1024 * 1024}
                    />
                  </View>

                  <Button
                    onPress={form.handleSubmit(onSubmit)}
                    disabled={isUploading || addActivityMutation.isPending}
                    style={styles.saveActivityButton}
                  >
                    {(isUploading || addActivityMutation.isPending) ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Save Activity</Text>
                    )}
                  </Button>
                </View>
              </Form>
            </CardContent>
          </Card>

          <View style={styles.rightColumn}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Live Activity Tracker</CardTitle>
                <CardDescription>
                  Live smartwatch data from your workouts. Select an activity type to view relevant metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.liveTrackerContent}>
                  <View style={styles.activityTypeSelection}>
                    <Text style={styles.activityTypeLabel}>Activity Type:</Text>
                    <Select
                      onValueChange={setSelectedActivityType}
                      items={activityTypes.map(type => ({ label: type, value: type }))}
                      placeholder={{ label: "Select activity type", value: null }}
                    />
                  </View>

                  <View style={styles.liveDataDisplay}>
                    <Text style={styles.watchIcon}>⌚</Text>
                    <Text style={styles.liveTrackerTitle}>Live Activity Tracker</Text>
                    <Text style={styles.liveTrackerSubtitle}>
                      Activity type: <Text style={styles.boldText}>{selectedActivityType}</Text>
                    </Text>
                    <Text style={styles.liveTrackerDescription}>
                      Connect your smartwatch to see live metrics here.
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Your most recent activities are shown here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                ) : activities && activities.length > 0 ? (
                  <View style={styles.activitiesList}>
                    {activities.map((activity) => (
                      <Card key={activity.id} style={styles.activityCard}>
                        <View style={styles.activityCardContent}>
                          {activity.filePath && (
                            <View style={styles.activityImageContainer}>
                              <RNImage
                                source={{ uri: activity.filePath }}
                                style={styles.activityImage}
                                onError={(e) => console.log("Image error", e.nativeEvent.error)}
                              />
                            </View>
                          )}
                          <View style={styles.activityDetails}>
                            <View style={styles.activityHeader}>
                              <Text style={styles.activityType}>{activity.activityType}</Text>
                              <Text style={styles.activityDate}>
                                {activity.date || activity.createdAt
                                  ? format(
                                      new Date(
                                        activity.date || activity.createdAt,
                                      ),
                                      "MMM d, yyyy",
                                    )
                                  : "No date available"}
                              </Text>
                            </View>
                            <Text style={styles.activityDescription}>
                              {activity.description}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Image size={48} color="gray" style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateTitle}>
                      No activities recorded
                    </Text>
                    <Text style={styles.emptyStateDescription}>
                      Add your first activity using the form on the left.
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Quick Weight Entry</CardTitle>
                <CardDescription>
                  Log weights for specific exercises quickly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <View style={styles.formSpace}>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem style={styles.formItem}>
                          <FormLabel>Exercise Name</FormLabel>
                          <Input
                            placeholder="e.g., Bench Press, Squat, Deadlift"
                            value={field.value}
                            onChangeText={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <View style={styles.weightEntryRow}>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem style={styles.formItemHalf}>
                            <FormLabel>Weight</FormLabel>
                            <Input
                              keyboardType="numeric"
                              placeholder="Enter weight"
                              value={field.value}
                              onChangeText={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem style={styles.formItemHalf}>
                            <FormLabel>Unit</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              items={[{ label: "kg", value: "kg" }, { label: "lbs", value: "lbs" }]}
                              placeholder={{ label: "Select unit", value: null }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </View>

                    <Button
                      onPress={form.handleSubmit(onSubmit)}
                      style={styles.logWeightButton}
                    >
                      <Dumbbell size={16} color="white" />
                      <Text style={styles.buttonText}>Log Weight</Text>
                    </Button>
                  </View>
                </Form>
              </CardContent>
            </Card>
          </View>
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // Adjust as needed for spacing
    marginBottom: 16,
  },
  formSpace: {
    gap: 16,
  },
  formItem: {
    marginBottom: 0, // Handled by formSpace gap
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "black",
  },
  photoEvidenceContainer: {
    marginTop: 16,
  },
  saveActivityButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  rightColumn: {
    flex: 1,
    gap: 16,
  },
  liveTrackerContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  activityTypeSelection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  activityTypeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  liveDataDisplay: {
    alignItems: "center",
  },
  watchIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  liveTrackerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  liveTrackerSubtitle: {
    fontSize: 14,
    color: "gray",
  },
  boldText: {
    fontWeight: "bold",
  },
  liveTrackerDescription: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activitiesList: {
    marginTop: 10,
  },
  activityCard: {
    marginBottom: 10,
    overflow: "hidden",
  },
  activityCardContent: {
    flexDirection: "row",
  },
  activityImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  activityImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  activityDetails: {
    flex: 1,
    padding: 10,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  activityType: {
    fontWeight: "bold",
  },
  activityDate: {
    fontSize: 12,
    color: "gray",
  },
  activityDescription: {
    fontSize: 12,
    color: "gray",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
  },
  weightEntryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  formItemHalf: {
    width: "48%",
  },
  logWeightButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
});
