import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select, SelectItem } from "../components/ui/Select";
import { Checkbox } from "../components/ui/Checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Measurement } from "../shared/schema";
import { format } from "date-fns";
import {
  User,
  Utensils,
  Heart,
  Dumbbell,
  Target,
  Activity,
  Edit2,
  Save,
  X,
  Upload,
  FileText,
  Trash2,
  Download,
} from "@expo/vector-icons";
import DocumentPicker from 'react-native-document-picker';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

// Unit conversion utilities (same as measurements page)
const convertWeight = (
  value: number,
  fromUnit: 'lbs' | 'kg',
  toUnit: 'lbs' | 'kg',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'lbs' && toUnit === 'kg') return value * 0.453592;
  if (fromUnit === 'kg' && toUnit === 'lbs') return value * 2.20462;
  return value;
};

// Display formatting functions
const formatWeight = (
  value: number,
  displaySystem: 'metric' | 'imperial',
): string => {
  if (displaySystem === 'imperial') {
    const lbs = convertWeight(value, 'kg', 'lbs');
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${value.toFixed(1)} kg`;
};

export default function Profile() {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [profileData, setProfileData] = useState<any>(null);
  const [uploadingBloodTest, setUploadingBloodTest] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('imperial'); // Default to imperial to match user preference
  const { toast } = useToast();

  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
  });

  const { data: measurements, isLoading: isLoadingMeasurements } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements"],
  });

  const { data: bloodTestResults, isLoading: isLoadingBloodTests, refetch: refetchBloodTests } = useQuery({
    queryKey: ["/api/blood-test-results"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/blood-test-results");
      if (!response.ok) {
        throw new Error("Failed to fetch blood test results");
      }
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await apiRequest("PATCH", "/api/profile", updatedData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (updatedProfile) => {
      setProfileData(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.setQueryData(['/api/profile'], updatedProfile);
      queryClient.setQueryData(['/api/user'], updatedProfile);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setEditingSection(null);
      setEditData({});
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startEditing = (section: string) => {
    setEditingSection(section);
    const currentProfile = profileData || profile;
    setEditData({ ...currentProfile });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveChanges = () => {
    if (!editData || Object.keys(editData).length === 0) {
      toast({
        title: "No Changes",
        description: "No data to save. Please make changes first.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(editData);
  };

  const updateEditData = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const uploadBloodTestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/blood-test-results", formData, { isFormData: true });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload blood test");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blood test result uploaded successfully",
      });
      refetchBloodTests();
      setUploadingBloodTest(false);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload blood test",
        variant: "destructive",
      });
      setUploadingBloodTest(false);
    },
  });

  const deleteBloodTestMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const response = await apiRequest("DELETE", `/api/blood-test-results/${resultId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete blood test");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blood test result deleted successfully",
      });
      refetchBloodTests();
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete blood test",
        variant: "destructive",
      });
    },
  });

  const handleBloodTestUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });

      const file = res[0];

      const formData = new FormData();
      formData.append('bloodTest', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      formData.append('notes', '');

      setUploadingBloodTest(true);
      uploadBloodTestMutation.mutate(formData);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        console.error("Unknown error: ", err);
        toast({
          title: "Error",
          description: "Failed to pick document.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoadingProfile || isLoadingMeasurements) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const latestMeasurement = measurements?.[measurements.length - 1];
  const currentProfile = profileData || profile;

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView style={styles.mainContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Your complete fitness and health profile
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {/* Personal Information */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardTitleContainer}>
                  <User size={20} color="black" />
                  <CardTitle>Personal Information</CardTitle>
                </View>
                {editingSection === "personal" ? (
                  <View style={styles.buttonGroup}>
                    <Button
                      onPress={saveChanges}
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save size={16} color="white" />
                      <Text style={styles.buttonText}>Save</Text>
                    </Button>
                    <Button
                      onPress={cancelEditing}
                      disabled={updateProfileMutation.isPending}
                      variant="outline"
                    >
                      <X size={16} color="black" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </Button>
                  </View>
                ) : (
                  <Button
                    onPress={() => startEditing("personal")}
                    variant="outline"
                  >
                    <Edit2 size={16} color="black" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </Button>
                )}
              </View>
            </CardHeader>
            <CardContent>
              {editingSection === "personal" ? (
                <View style={styles.formGrid}>
                  <View>
                    <Text style={styles.label}>Name</Text>
                    <Input
                      value={editData?.name || ""}
                      onChangeText={(text) => updateEditData("name", text)}
                      placeholder="Enter your name"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.readOnlyText}>
                      {currentProfile?.username || "Not provided"}
                    </Text>
                    <Text style={styles.hintText}>Username cannot be changed</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Email</Text>
                    <Input
                      value={editData?.email || ""}
                      onChangeText={(text) => updateEditData("email", text)}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>Phone</Text>
                    <Input
                      value={editData?.phone || ""}
                      onChangeText={(text) => updateEditData("phone", text)}
                      placeholder="Enter your phone"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>City</Text>
                    <Input
                      value={editData?.city || ""}
                      onChangeText={(text) => updateEditData("city", text)}
                      placeholder="Enter your city"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>Age</Text>
                    <Input
                      value={editData?.age?.toString() || ""}
                      onChangeText={(text) => updateEditData("age", parseInt(text) || null)}
                      placeholder="Enter your age"
                      keyboardType="numeric"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>Height</Text>
                    <Input
                      value={editData?.height || ""}
                      onChangeText={(text) => updateEditData("height", text)}
                      placeholder="e.g., 6'2 inches, 180cm"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formGrid}>
                  <View>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.name || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.username || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.email || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.phone || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>City</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.city || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Age</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.age || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Height</Text>
                    <Text style={styles.valueText}>
                      {currentProfile?.height || "Not provided"}
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Profile */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Utensils size={20} color="black" />
                <CardTitle>Nutrition Profile</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.sectionContent}>
                <View>
                  <Text style={styles.label}>Diet Type</Text>
                  <Text style={styles.valueText}>
                    {currentProfile?.dietType || "Not specified"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.label}>Daily Diet Description</Text>
                  <Text style={styles.valueText}>
                    {currentProfile?.dailyDiet || "Not provided"}
                  </Text>
                </View>
                <View style={styles.twoColumnGrid}>
                  <View>
                    <Text style={styles.label}>Water Intake</Text>
                    <Text style={styles.valueText}>
                      {profile?.waterIntake || "Not specified"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Nutrition Rating</Text>
                    <Text style={styles.valueText}>
                      {profile?.nutritionRating
                        ? `${profile.nutritionRating}/10`
                        : "Not rated"}
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeContainer}>
                  {profile?.coffeeDrinker && (
                    <Badge variant="secondary">
                      Coffee Drinker ({profile?.coffeeCupsPerDay || 0} cups/day)
                    </Badge>
                  )}
                  {profile?.alcoholDrinker && (
                    <Badge variant="secondary">
                      Alcohol ({profile?.alcoholPerWeek || "Not specified"})
                    </Badge>
                  )}
                  {profile?.smoker && (
                    <Badge variant="destructive">
                      Smoker ({profile?.smokingFrequency || "Not specified"})
                    </Badge>
                  )}
                </View>
                {profile?.dietaryRestrictions && (
                  <View>
                    <Text style={styles.label}>Dietary Restrictions</Text>
                    <Text style={styles.valueText}>
                      {profile.dietaryRestrictions}
                    </Text>
                  </View>
                )}
                {profile?.medicationsSupplements && (
                  <View>
                    <Text style={styles.label}>Medications & Supplements</Text>
                    <Text style={styles.valueText}>
                      {profile.medicationsSupplements}
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Fitness & Exercise */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Dumbbell size={20} color="black" />
                <CardTitle>Fitness & Exercise</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.sectionContent}>
                <View>
                  <Text style={styles.label}>Fitness Level</Text>
                  <Text style={styles.valueText}>
                    {profile?.fitnessLevel || "Not specified"}
                  </Text>
                </View>
                {profile?.currentExercises && (
                  <View>
                    <Text style={styles.label}>Current Exercises</Text>
                    <Text style={styles.valueText}>
                      {profile.currentExercises}
                    </Text>
                  </View>
                )}
                {profile?.personalRecords && (
                  <View>
                    <Text style={styles.label}>Personal Records</Text>
                    <Text style={styles.valueText}>
                      {profile.personalRecords}
                    </Text>
                  </View>
                )}
                {profile?.playedSports && (
                  <View>
                    <Text style={styles.label}>Sports Background</Text>
                    <Text style={styles.valueText}>
                      {profile.playedSports}
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Health & Lifestyle */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Heart size={20} color="black" />
                <CardTitle>Health & Lifestyle</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.sectionContent}>
                <View style={styles.twoColumnGrid}>
                  <View>
                    <Text style={styles.label}>Stress Level</Text>
                    <Text style={styles.valueText}>
                      {profile?.stressLevel
                        ? `${profile.stressLevel}/10`
                        : "Not rated"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Sleep Hours</Text>
                    <Text style={styles.valueText}>
                      {profile?.sleepHours
                        ? `${profile.sleepHours} hours`
                        : "Not specified"}
                    </Text>
                  </View>
                </View>
                <View style={styles.badgeContainer}>
                  {profile?.stressPains && <Badge variant="outline">Stress-related Pains</Badge>}
                  {profile?.stressEater && <Badge variant="outline">Stress Eater</Badge>}
                  {profile?.teethGrinding && <Badge variant="outline">Teeth Grinding</Badge>}
                </View>
                {profile?.injuries && (
                  <View>
                    <Text style={styles.label}>Injuries</Text>
                    <Text style={styles.valueText}>
                      {profile.injuries}
                    </Text>
                  </View>
                )}
                {profile?.hadSurgery && (
                  <View>
                    <Text style={styles.label}>Surgery History</Text>
                    <Text style={styles.valueText}>
                      Had surgery {profile?.surgeryDate ? `on ${profile.surgeryDate}` : ""}
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Target size={20} color="black" />
                <CardTitle>Fitness Goals</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              {profile?.fitnessGoals ? (
                <Text style={styles.valueText}>{profile.fitnessGoals}</Text>
              ) : (
                <Text style={styles.mutedText}>No fitness goals specified</Text>
              )}
            </CardContent>
          </Card>

          {/* Latest Measurements */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardTitleContainer}>
                  <Activity size={20} color="black" />
                  <CardTitle>Latest Measurements</CardTitle>
                </View>
                <Button onPress={() => { /* Navigate to measurements */ }} variant="outline">
                  <Text style={styles.buttonText}>View All</Text>
                </Button>
              </View>
              {measurements && measurements.length > 0 && (
                <Text style={styles.mutedText}>
                  {measurements[0].date ? format(new Date(measurements[0].date), "MMMM d, yyyy") : "Recent"}
                </Text>
              )}
            </CardHeader>
            <CardContent>
              {measurements && measurements.length > 0 ? (
                <View style={styles.sectionContent}>
                  <View style={styles.twoColumnGrid}>
                    {latestMeasurement?.weight && (
                      <>
                        <Text style={styles.label}>Weight</Text>
                        <Text style={styles.valueText}>
                          {formatWeight(latestMeasurement.weight, unitSystem)}
                        </Text>
                      </>
                    )}
                    {latestMeasurement?.bmi && (
                      <>
                        <Text style={styles.label}>BMI</Text>
                        <Text style={styles.valueText}>
                          {latestMeasurement.bmi}
                        </Text>
                      </>
                    )}
                    {latestMeasurement?.bodyFat && (
                      <>
                        <Text style={styles.label}>Body Fat</Text>
                        <Text style={styles.valueText}>
                          {latestMeasurement.bodyFat}%
                        </Text>
                      </>
                    )}
                    {latestMeasurement?.muscleMass && (
                      <>
                        <Text style={styles.label}>Muscle Mass</Text>
                        <Text style={styles.valueText}>
                          {formatWeight(latestMeasurement.muscleMass, unitSystem)}
                        </Text>
                      </>
                    )}
                    {latestMeasurement?.bmr && (
                      <>
                        <Text style={styles.label}>BMR</Text>
                        <Text style={styles.valueText}>
                          {latestMeasurement.bmr} cal
                        </Text>
                      </>
                    )}
                  </View>
                  {measurements.length > 1 && (
                    <View style={styles.separator}>
                      <Text style={styles.hintText}>
                        {measurements.length - 1} more measurement
                        {measurements.length > 2 ? 's' : ''} available
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.mutedText}>No measurements recorded yet</Text>
                  <Button onPress={() => { /* Navigate to add measurement */ }}>
                    <Text style={styles.buttonText}>Add First Measurement</Text>
                  </Button>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Blood Test Results Section */}
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardTitleContainer}>
                  <Activity size={20} color="black" />
                  <CardTitle>Blood Test Results</CardTitle>
                </View>
                <Button
                  onPress={handleBloodTestUpload}
                  disabled={uploadingBloodTest}
                >
                  {uploadingBloodTest ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Upload size={16} color="white" />
                  )}
                  <Text style={styles.buttonText}>Upload</Text>
                </Button>
              </View>
            </CardHeader>
            <CardContent>
              {isLoadingBloodTests ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : bloodTestResults && bloodTestResults.length > 0 ? (
                <View style={styles.bloodTestResultsContainer}>
                  {bloodTestResults.map((result: any) => (
                    <View key={result.id} style={styles.bloodTestResultItem}>
                      <View style={styles.bloodTestResultInfo}>
                        <View style={styles.fileIconContainer}>
                          <FileText size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.fileDetails}>
                          <Text style={styles.fileName}>{result.fileName}</Text>
                          <Text style={styles.fileUploadDate}>
                            Uploaded {new Date(result.uploadedAt).toLocaleDateString()}
                          </Text>
                          <Badge variant="secondary" style={styles.fileTypeBadge}>
                            {result.fileType === 'application/pdf' ? 'PDF' :
                              result.fileType === 'image/png' ? 'PNG' : 'JPEG'}
                          </Badge>
                        </View>
                      </View>
                      <View style={styles.buttonGroup}>
                        <Button
                          onPress={() => WebBrowser.openBrowserAsync(result.filePath)}
                          variant="outline"
                        >
                          <Download size={16} color="black" />
                          <Text style={styles.buttonText}>View</Text>
                        </Button>
                        <Button
                          onPress={() => deleteBloodTestMutation.mutate(result.id)}
                          disabled={deleteBloodTestMutation.isPending}
                          variant="outline"
                        >
                          {deleteBloodTestMutation.isPending ? (
                            <ActivityIndicator size="small" color="black" />
                          ) : (
                            <Trash2 size={16} color="black" />
                          )}
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <FileText size={48} color="gray" style={styles.emptyStateIcon} />
                  <Text style={styles.mutedText}>No blood test results uploaded yet</Text>
                  <Text style={styles.hintText}>Upload your blood test results in PDF, PNG, or JPEG format</Text>
                </View>
              )}
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
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  cardHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    marginLeft: 4,
    color: "white",
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    marginBottom: 8,
  },
  readOnlyText: {
    fontSize: 14,
    paddingTop: 2,
    color: "gray",
  },
  hintText: {
    fontSize: 10,
    color: "gray",
  },
  sectionContent: {
    marginBottom: 16,
  },
  twoColumnGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 8,
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  mutedText: {
    color: "gray",
    marginBottom: 8,
  },
  bloodTestResultsContainer: {
    marginTop: 16,
  },
  bloodTestResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    marginBottom: 8,
  },
  bloodTestResultInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileIconContainer: {
    padding: 8,
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  fileUploadDate: {
    fontSize: 12,
    color: "gray",
    marginBottom: 4,
  },
  fileTypeBadge: {
    alignSelf: "flex-start",
  },
});
