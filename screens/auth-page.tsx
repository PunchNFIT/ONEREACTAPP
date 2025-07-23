import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertUserSchema,
  registrationSchema,
  RegistrationFormData,
} from "@shared/schema";
import { useRouter } from "expo-router";
import * as z from "zod";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/Form";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Select, SelectItem } from "../../components/ui/Select";
import { Checkbox } from "../../components/ui/Checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Dumbbell,
  Crosshair,
  Activity,
  Heart,
  Moon,
  Trophy,
  Ruler,
  Target,
  User,
} from "@expo/vector-icons";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const router = useRouter();
  const [formStep, setFormStep] = useState(0);

  const formSteps = [
    { name: "Account", icon: <User size={16} /> },
    { name: "Nutrition", icon: <Utensils size={16} /> },
    { name: "Injuries", icon: <Crosshair size={16} /> },
    { name: "Exercise", icon: <Dumbbell size={16} /> },
    { name: "Stress", icon: <Heart size={16} /> },
    { name: "Sleep", icon: <Moon size={16} /> },
    { name: "Sports", icon: <Trophy size={16} /> },
    { name: "Measurements", icon: <Ruler size={16} /> },
    { name: "Goals", icon: <Target size={16} /> },
  ];

  type LoginFormData = {
    username: string;
    password: string;
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      role: "client",
      nutritionRating: 5,
      coffeeDrinker: false,
      coffeeCupsPerDay: 0,
      alcoholDrinker: false,
      smoker: false,
      hadSurgery: false,
      stressLevel: 5,
      stressPains: false,
      stressEater: false,
      sleepHours: 7,
      teethGrinding: false,
      dietType: "Meat Eater",
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
    },
  });

  const nextStep = async () => {
    const fields = getFieldsForStep(formStep) as any;
    const isValid = await registerForm.trigger(fields);
    if (isValid) {
      setFormStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setFormStep((prev) => prev - 1);
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ["username", "password", "name", "email", "phone"];
      case 1:
        return [
          "nutritionRating",
          "dailyDiet",
          "waterIntake",
          "coffeeDrinker",
          "coffeeCupsPerDay",
          "alcoholDrinker",
          "alcoholPerWeek",
          "smoker",
          "smokingFrequency",
          "dietType",
          "dietaryRestrictions",
          "medicationsSupplements",
        ];
      case 2:
        return ["injuries", "hadSurgery", "surgeryDate"];
      case 3:
        return ["currentExercises", "personalRecords", "fitnessLevel"];
      case 4:
        return ["stressLevel", "stressPains", "stressEater"];
      case 5:
        return ["sleepHours", "teethGrinding"];
      case 6:
        return ["playedSports"];
      case 7:
        return ["height", "weight", "age"];
      case 8:
        return ["fitnessGoals"];
      default:
        return [];
    }
  };

  const handleRegistration = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.headerContainer}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logo}
            />
            <CardTitle>ONE - AI Fitness Trainer - Agent</CardTitle>
          </View>
          <CardDescription>
            Sign in or create a new account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input secureTextEntry {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  onPress={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  disabled={loginMutation.isPending}
                >
                  Login
                </Button>
                <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                  <Text style={styles.link}>Forgot your password?</Text>
                </TouchableOpacity>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <View style={styles.progressContainer}>
                  {formSteps.map((step, index) => (
                    <View
                      key={index}
                      style={[
                        styles.step,
                        index <= formStep && styles.activeStep,
                      ]}
                    >
                      {step.icon}
                      <Text style={styles.stepText}>{step.name}</Text>
                    </View>
                  ))}
                </View>

                {formStep === 0 && (
                  <View>
                    <Text style={styles.stepTitle}>Account Information</Text>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* ... other fields ... */}
                  </View>
                )}

                {/* ... other steps ... */}

                <View style={styles.buttonContainer}>
                  {formStep > 0 && (
                    <Button onPress={prevStep} variant="outline">
                      <ArrowLeft size={16} /> Previous
                    </Button>
                  )}

                  {formStep < formSteps.length - 1 && (
                    <Button onPress={nextStep}>
                      Next <ArrowRight size={16} />
                    </Button>
                  )}

                  {formStep === formSteps.length - 1 && (
                    <Button
                      onPress={registerForm.handleSubmit(handleRegistration)}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending
                        ? "Registering..."
                        : "Complete Registration"}
                    </Button>
                  )}
                </View>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F3F4F6",
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 48,
    height: 48,
  },
  link: {
    color: "#007BFF",
    textAlign: "center",
    marginTop: 16,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  step: {
    alignItems: "center",
    opacity: 0.5,
  },
  activeStep: {
    opacity: 1,
  },
  stepText: {
    fontSize: 12,
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
});