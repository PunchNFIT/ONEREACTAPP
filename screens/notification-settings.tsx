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
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { Label } from "../components/ui/Label";
import {
  Select,
  SelectItem,
} from "../components/ui/Select";
import { TimePickerDemo } from "../components/ui/TimePicker";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Bell, BellRing, CalendarRange, Clock } from "@expo/vector-icons";

interface NotificationSettings {
  dailyRecap: boolean;
  dailyRecapTime: string;
  workoutReminders: boolean;
  reminderAdvanceTime: string; // e.g., "30min", "1hour", "2hours"
  smsNotifications: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyRecap: true,
    dailyRecapTime: "19:00", // 7 PM default
    workoutReminders: true,
    reminderAdvanceTime: "1hour",
    smsNotifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/notification-settings");
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        toast({
          title: "Error",
          description: "Failed to load your notification settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await apiRequest(
        "POST",
        "/api/notification-settings",
        settings,
      );

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Your notification preferences have been updated",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save your notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    try {
      const response = await apiRequest('/api/test-sms', {}, "POST");
      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Test SMS sent successfully to your phone!');
      } else {
        Alert.alert('Error', `SMS test failed: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'SMS test failed: Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <ScrollView style={styles.mainContent}>
        <Text style={styles.title}>Notification Settings</Text>

        <View style={styles.cardContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <BellRing size={20} color="black" />
                <Text>Daily Recap</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingItem}>
                <View>
                  <Label>Receive Daily Recap</Label>
                  <Text style={styles.mutedText}>
                    Get a summary of your activities, workouts, and nutrition at
                    the end of the day.
                  </Text>
                </View>
                <Switch
                  value={settings.dailyRecap}
                  onValueChange={(checked) =>
                    setSettings({ ...settings, dailyRecap: checked })
                  }
                />
              </View>

              {settings.dailyRecap && (
                <View style={styles.timePickerContainer}>
                  <Label>Preferred Time</Label>
                  <View style={styles.timePickerRow}>
                    <Clock size={16} color="gray" />
                    <TimePickerDemo
                      value={settings.dailyRecapTime}
                      onChange={(time) =>
                        setSettings({ ...settings, dailyRecapTime: time })
                      }
                    />
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <CalendarRange size={20} color="black" />
                <Text>Workout Reminders</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingItem}>
                <View>
                  <Label>Workout Reminders</Label>
                  <Text style={styles.mutedText}>
                    Get reminders before your scheduled workouts.
                  </Text>
                </View>
                <Switch
                  value={settings.workoutReminders}
                  onValueChange={(checked) =>
                    setSettings({ ...settings, workoutReminders: checked })
                  }
                />
              </View>

              {settings.workoutReminders && (
                <View style={styles.selectContainer}>
                  <Label>Remind Me</Label>
                  <Select
                    onValueChange={(value) =>
                      setSettings({ ...settings, reminderAdvanceTime: value })
                    }
                    items={[
                      { label: "15 minutes before", value: "15min" },
                      { label: "30 minutes before", value: "30min" },
                      { label: "1 hour before", value: "1hour" },
                      { label: "2 hours before", value: "2hours" },
                      { label: "1 day before", value: "1day" },
                    ]}
                    placeholder={{ label: "Select time", value: null }}
                  />
                </View>
              )}
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Bell size={20} color="black" />
                <Text>SMS Notifications</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingItem}>
                <View>
                  <Label>SMS Notifications</Label>
                  <Text style={styles.mutedText}>
                    Receive notifications via text message to your phone.
                  </Text>
                </View>
                <Switch
                  value={settings.smsNotifications}
                  onValueChange={(checked) =>
                    setSettings({ ...settings, smsNotifications: checked })
                  }
                />
              </View>

              {settings.smsNotifications && (
                <View style={styles.smsInfoContainer}>
                  <Text style={styles.smsInfoText}>
                    Your notifications will be sent to:
                    <Text style={styles.smsPhoneNumber}>
                      {user?.phone || "No phone number found"}
                    </Text>
                  </Text>
                  <Text style={styles.smsHintText}>
                    To update your phone number, please go to your profile
                    settings.
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          <View style={styles.buttonGroup}>
            <Button
              onPress={handleTestSMS}
              style={styles.testSmsButton}
            >
              <Text style={styles.testSmsButtonText}>📱 Test SMS Notifications</Text>
            </Button>
            <Button
              onPress={handleSaveSettings}
              disabled={saving || loading}
              style={styles.saveSettingsButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveSettingsButtonText}>Save Settings</Text>
              )}
            </Button>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardContainer: {
    // Styles for the container holding all cards
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardContent: {
    paddingTop: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  mutedText: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  timePickerContainer: {
    marginTop: 10,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 5,
  },
  selectContainer: {
    marginTop: 10,
  },
  smsInfoContainer: {
    marginTop: 15,
  },
  smsInfoText: {
    fontSize: 14,
  },
  smsPhoneNumber: {
    fontWeight: "bold",
    marginLeft: 5,
  },
  smsHintText: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  buttonGroup: {
    marginTop: 20,
  },
  testSmsButton: {
    backgroundColor: "transparent",
    borderColor: "#2563EB",
    borderWidth: 1,
    marginBottom: 10,
  },
  testSmsButtonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },
  saveSettingsButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveSettingsButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
