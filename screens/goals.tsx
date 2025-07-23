import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Goal } from "../shared/schema";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/Form";
import { Input } from "../components/ui/Input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "@expo/vector-icons";
import { useAuth } from "../hooks/use-auth";

const goalFormSchema = z.object({
  month: z.string().min(1, "Month is required"),
  weightLoss: z.number().min(0, "Weight loss must be positive"),
  muscleGain: z.number().min(0, "Muscle gain must be positive"),
  bodyFatReduction: z.number().min(0, "Body fat reduction must be positive"),
  status: z.string().optional().default("in_progress"),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      month: new Date().toISOString().slice(0, 7),
      weightLoss: 0,
      muscleGain: 0,
      bodyFatReduction: 0,
      status: "in_progress",
    },
  });

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/goals");
        return res.json();
      } catch (error) {
        console.error("Failed to fetch goals:", error);
        toast({
          title: "Error",
          description: "Failed to fetch goals",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const goalMutation = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      if (!user || !user.id) {
        throw new Error("User ID is required. Please log in again.");
      }

      try {
        const data = {
          month: values.month,
          weightLoss: Number(values.weightLoss),
          muscleGain: Number(values.muscleGain),
          bodyFatReduction: Number(values.bodyFatReduction),
          userId: user.id,
        };
        const res = await apiRequest("POST", "/api/goals", data);
        const responseText = await res.text();

        let jsonResponse;
        try {
          jsonResponse = JSON.parse(responseText);
        } catch (e) {
          // Not JSON, that's fine
        }

        if (!res.ok) {
          throw new Error(responseText || res.statusText);
        }

        return jsonResponse || null;
      } catch (error) {
        console.error("Goal mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      form.reset();
      setIsSubmitting(false);
      toast({
        title: "Success",
        description: "Goal added successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Goal mutation error:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to add goal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GoalFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to set goals",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    goalMutation.mutate(data);
  };

  if (isLoading) {
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
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>
          Set your fitness goals to earn VII-FT reward tokens when you achieve them.
        </Text>
        <Text style={styles.rewardsText}>
          🏆 Weight Loss: 10 VII-FT • 💪 Muscle Gain: 15 VII-FT • 🔥 Body Fat Reduction: 12 VII-FT
        </Text>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Set New Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <View>
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="YYYY-MM"
                            value={field.value}
                            onChangeText={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Loss Goal (lbs) - 10 VII-FT Reward</FormLabel>
                        <FormControl>
                          <Input
                            keyboardType="numeric"
                            placeholder="0.0"
                            value={field.value?.toString() || ""}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="muscleGain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Muscle Gain Goal (lbs) - 15 VII-FT Reward</FormLabel>
                        <FormControl>
                          <Input
                            keyboardType="numeric"
                            placeholder="0.0"
                            value={field.value?.toString() || ""}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyFatReduction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Fat Reduction Goal (%) - 12 VII-FT Reward</FormLabel>
                        <FormControl>
                          <Input
                            keyboardType="numeric"
                            placeholder="0.0"
                            value={field.value?.toString() || ""}
                            onChangeText={(text) => {
                              const numValue = parseFloat(text);
                              field.onChange(isNaN(numValue) ? undefined : numValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    onPress={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting || goalMutation.isPending}
                    style={styles.submitButton}
                  >
                    {isSubmitting || goalMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Add Goal</Text>
                    )}
                  </Button>
                </View>
              </Form>
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Current Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.goalsList}>
                {goals && goals.length > 0 ? (
                  goals.map((goal) => (
                    <View key={goal.id} style={styles.goalItem}>
                      <Text style={styles.goalMonth}>{goal.month}</Text>
                      <View style={styles.goalDetails}>
                        <Text>Weight Loss: {goal.weightLoss} lbs</Text>
                        <Text>Muscle Gain: {goal.muscleGain} lbs</Text>
                        <Text>Body Fat Reduction: {goal.bodyFatReduction}%</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noGoalsContainer}>
                    <Text style={styles.noGoalsText}>No goals found</Text>
                  </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 8,
  },
  rewardsText: {
    fontSize: 12,
    color: "gray",
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
  submitButton: {
    backgroundColor: "#DC2626",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
  },
  goalsList: {
    marginTop: 10,
  },
  goalItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 10,
    marginBottom: 10,
  },
  goalMonth: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  goalDetails: {
    marginLeft: 10,
  },
  noGoalsContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noGoalsText: {
    color: "gray",
  },
});
