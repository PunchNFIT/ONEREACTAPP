import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import { User, Measurement, Goal } from "../shared/schema";
import { Button } from "../components/ui/Button";
import { Progress } from "../components/ui/Progress";
import { BlogFeed } from "../components/town-hall/BlogFeed";
import { Chat } from "../components/town-hall/Chat";
import { ChevronLeft, ChevronRight } from "@expo/vector-icons";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { BarChart } from "react-native-charts-wrapper";

interface Performance {
  metric: string;
  value: string;
  percentComplete: number;
  status: "success" | "warning" | "error";
}

function calculatePerformance(
  measurements: Measurement[],
  goals: Goal[],
): Performance[] {
  if (!measurements.length || !goals.length) {
    return [];
  }

  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];

  const previousMeasurement =
    sortedMeasurements.length > 1
      ? sortedMeasurements[sortedMeasurements.length - 2]
      : null;

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentGoal = goals.find((g) => g.month === currentMonth);

  if (!currentGoal || !previousMeasurement) {
    return [];
  }

  const performance: Performance[] = [];

  if (
    currentGoal.weightLoss &&
    previousMeasurement.weight &&
    latestMeasurement.weight
  ) {
    const targetWeight = previousMeasurement.weight - parseFloat(currentGoal.weightLoss);
    const actualWeight = latestMeasurement.weight;
    const weightDifference = previousMeasurement.weight - actualWeight;
    const percentComplete = Math.min(
      100,
      Math.max(0, (weightDifference / parseFloat(currentGoal.weightLoss)) * 100),
    );

    let status: "success" | "warning" | "error" = "error";
    if (percentComplete >= 100) {
      status = "success";
    } else if (percentComplete >= 90) {
      status = "warning";
    }

    performance.push({
      metric: "Weight Loss",
      value: `${weightDifference.toFixed(1)} / ${currentGoal.weightLoss} lbs`,
      percentComplete,
      status,
    });
  }

  if (
    currentGoal.muscleGain &&
    previousMeasurement.muscleMass &&
    latestMeasurement.muscleMass
  ) {
    const targetMuscle =
      previousMeasurement.muscleMass + currentGoal.muscleGain;
    const actualMuscle = latestMeasurement.muscleMass;
    const muscleDifference = actualMuscle - previousMeasurement.muscleMass;
    const percentComplete = Math.min(
      100,
      Math.max(0, (muscleDifference / parseFloat(currentGoal.muscleGain)) * 100),
    );

    let status: "success" | "warning" | "error" = "error";
    if (percentComplete >= 100) {
      status = "success";
    } else if (percentComplete >= 90) {
      status = "warning";
    }

    performance.push({
      metric: "Muscle Gain",
      value: `${muscleDifference.toFixed(1)} / ${currentGoal.muscleGain} lbs`,
      percentComplete,
      status,
    });
  }

  if (
    currentGoal.bodyFatReduction &&
    previousMeasurement.bodyFat &&
    latestMeasurement.bodyFat
  ) {
    const targetBodyFat =
      previousMeasurement.bodyFat - parseFloat(currentGoal.bodyFatReduction);
    const actualBodyFat = latestMeasurement.bodyFat;
    const bodyFatDifference = previousMeasurement.bodyFat - actualBodyFat;
    const percentComplete = Math.min(
      100,
      Math.max(0, (bodyFatDifference / parseFloat(currentGoal.bodyFatReduction)) * 100),
    );

    let status: "success" | "warning" | "error" = "error";
    if (percentComplete >= 100) {
      status = "success";
    } else if (percentComplete >= 90) {
      status = "warning";
    }

    performance.push({
      metric: "Body Fat Reduction",
      value: `${bodyFatDifference.toFixed(1)} / ${currentGoal.bodyFatReduction}%`,
      percentComplete,
      status,
    });
  }

  return performance;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: measurements } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements"],
  });
  const { data: goals } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });

  const performance = calculatePerformance(measurements || [], goals || []);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>(
    {},
  );

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useEffect(() => {
    if (user) {
      apiRequest("GET", "/api/attendance")
        .then((res) => res.json())
        .then((data) => {
          const map: Record<string, string> = {};
          data.forEach((item: any) => {
            const date = format(new Date(item.date), "yyyy-MM-dd");
            map[date] = item.attended
              ? "present"
              : item.notes === "excused"
                ? "excused"
                : "absent";
          });
          setAttendanceMap(map);
        })
        .catch((err) => {
          console.error("Failed to fetch attendance", err);
        });
    }
  }, [user, currentMonth]);

  if (!measurements || !goals) {
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
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={{ height: 200 }}>
                <BarChart
                  data={{
                    dataSets: [{
                      label: "Performance",
                      values: performance.map(p => ({ y: p.percentComplete }))
                    }]
                  }}
                  xAxis={{
                    valueFormatter: performance.map(p => p.metric),
                    granularityEnabled: true,
                    granularity: 1,
                    position: "BOTTOM",
                    drawGridLines: false,
                  }}
                  yAxis={{
                    left: { axisMinimum: 0, axisMaximum: 100 },
                    right: { enabled: false }
                  }}
                  chartDescription={{ text: "" }}
                  legend={{ enabled: false }}
                />
              </View>
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Monthly Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {goals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalTextContainer}>
                    <Text>{goal.month}</Text>
                    <Text>
                      {
                        Object.values(goal.achieved || {}).filter(Boolean)
                          .length
                      }{" "}
                      / 3
                    </Text>
                  </View>
                  <Progress
                    value={
                      (Object.values(goal.achieved || {}).filter(Boolean)
                        .length /
                        3) *
                      100
                    }
                  />
                </View>
              ))}
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader style={styles.attendanceHeader}>
              <CardTitle>Monthly Attendance</CardTitle>
              <View style={styles.monthNavigation}>
                <Button onPress={previousMonth} variant="outline">
                  <ChevronLeft name="chevron-left" size={16} />
                </Button>
                <Text style={styles.monthText}>
                  {format(currentMonth, "MMMM yyyy")}
                </Text>
                <Button onPress={nextMonth} variant="outline">
                  <ChevronRight name="chevron-right" size={16} />
                </Button>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.calendarGrid}>
                {daysInMonth.map((day, i) => {
                  const date = format(day, "yyyy-MM-dd");
                  const status = attendanceMap[date];

                  let dayStyle = styles.day;
                  if (status === "present") {
                    dayStyle = styles.dayPresent;
                  } else if (status === "absent") {
                    dayStyle = styles.dayAbsent;
                  } else if (status === "excused") {
                    dayStyle = styles.dayExcused;
                  } else {
                    dayStyle = styles.dayDefault;
                  }

                  return (
                    <View key={i} style={dayStyle}>
                      <Text style={styles.dayText}>{format(day, "d")}</Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => {}}
                style={styles.attendanceLink}
              >
                <Text style={styles.attendanceLinkText}>
                  View complete attendance history
                </Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>

        <View style={styles.gridContainer}>
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Community Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogFeed />
            </CardContent>
          </Card>

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Community Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <Chat />
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
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  goalItem: {
    marginBottom: 10,
  },
  goalTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  day: {
    width: "13%", // Approx 1/7th for 7 days a week
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    margin: "0.5%",
  },
  dayPresent: {
    backgroundColor: "#D1FAE5",
  },
  dayAbsent: {
    backgroundColor: "#FEE2E2",
  },
  dayExcused: {
    backgroundColor: "#FEF3C7",
  },
  dayDefault: {
    backgroundColor: "#E5E7EB",
  },
  dayText: {
    fontSize: 12,
  },
  attendanceLink: {
    marginTop: 10,
    alignItems: "center",
  },
  attendanceLinkText: {
    color: "gray",
    textDecorationLine: "underline",
  },
});
