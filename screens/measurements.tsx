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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Separator } from "../components/ui/Separator";
import { Badge } from "../components/ui/Badge";
import { Select, SelectItem } from "../components/ui/Select";
import { useToast } from "../hooks/use-toast";
import {
  Ruler,
  Activity,
  TrendingUp,
  Plus,
  Bluetooth,
  Scale,
  Zap,
  CheckCircle,
  AlertCircle,
} from "@expo/vector-icons";
import { format } from "date-fns";
import { apiRequest } from "../lib/queryClient";

interface LeFuMeasurement {
  weight: number;
  bodyFat: number;
  bmi: number;
  muscleMass: number;
  boneMass: number;
  visceralFat: number;
  totalBodyWater: number;
  bmr: number;
  metabolicAge?: number;
  proteinLevel?: number;
  subcutaneousFat?: number;
  bodyType?: number;
  heartRate?: number;
  cardiacIndex?: number;
  leftArmMuscle?: number;
  rightArmMuscle?: number;
  trunkMuscle?: number;
  leftLegMuscle?: number;
  rightLegMuscle?: number;
  leftArmFat?: number;
  rightArmFat?: number;
  trunkFat?: number;
  leftLegFat?: number;
  rightLegFat?: number;
  deviceName: string;
  source: 'lefu_scale' | 'manual';
}

interface Measurement extends LeFuMeasurement {
  id: string;
  leanBodyMass?: number;
  neck?: number;
  shoulders?: number;
  chest?: number;
  upperArmLeft?: number;
  upperArmRight?: number;
  forearmLeft?: number;
  forearmRight?: number;
  wristLeft?: number;
  wristRight?: number;
  waist?: number;
  hips?: number;
  thighLeft?: number;
  thighRight?: number;
  knees?: number;
  calfLeft?: number;
  calfRight?: number;
  ankleLeft?: number;
  ankleRight?: number;
  triceps?: number;
  biceps?: number;
  subscapular?: number;
  suprailiac?: number;
  midAxillary?: number;
  thigh?: number;
  calf?: number;
  squatMax?: number;
  benchMax?: number;
  deadliftMax?: number;
  pushupCount?: number;
  plankTime?: number;
  verticalJump?: number;
  timestamp: string;
}

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

const convertLength = (
  value: number,
  fromUnit: 'in' | 'cm',
  toUnit: 'in' | 'cm',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'in' && toUnit === 'cm') return value * 2.54;
  if (fromUnit === 'cm' && toUnit === 'in') return value / 2.54;
  return value;
};

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

const formatLength = (
  value: number,
  displaySystem: 'metric' | 'imperial',
): string => {
  if (displaySystem === 'imperial') {
    const inches = convertLength(value, 'cm', 'in');
    return `${inches.toFixed(1)} in`;
  }
  return `${value.toFixed(1)} cm`;
};

export default function MeasurementsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Measurement>>({});
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('imperial');
  const [lefuStatus, setLefuStatus] = useState<
    'idle' | 'scanning' | 'connecting' | 'measuring' | 'error'
  >('idle');
  const [lefuDevice, setLefuDevice] = useState<string | null>(null);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // In a real React Native app, you'd check Bluetooth availability using a native module
    // For now, we'll assume it's supported for the demo flow.
    setBluetoothSupported(true);
  }, []);

  const { data: measurements = [], isLoading } = useQuery<Measurement[]>({
    queryKey: ['/api/measurements'],
  });

  const scanForLeFuDevices = async () => {
    if (!bluetoothSupported) {
      toast({
        title: "Bluetooth not supported",
        description: "Bluetooth is not supported on this device.",
        variant: "destructive",
      });
      return;
    }

    setLefuStatus('scanning');
    toast({
      title: "Scanning for LeFu devices",
      description: "Please ensure your scale is in pairing mode.",
    });

    // Simulate scanning and connecting
    setTimeout(() => {
      setLefuDevice("LeFu Scale XYZ");
      setLefuStatus('idle');
      toast({
        title: "LeFu Device Connected",
        description: "Successfully connected to LeFu Scale XYZ",
      });
    }, 3000);
  };

  const simulateLeFuMeasurement = async () => {
    setLefuStatus('measuring');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockLeFuData: Partial<LeFuMeasurement> = {
      weight: 75.2,
      bodyFat: 15.8,
      bmi: 23.4,
      muscleMass: 58.9,
      boneMass: 3.2,
      visceralFat: 8,
      totalBodyWater: 55.4,
      bmr: 1687,
      metabolicAge: 25,
      proteinLevel: 18.2,
      leftArmMuscle: 3.8,
      rightArmMuscle: 3.9,
      trunkMuscle: 28.5,
      leftLegMuscle: 11.3,
      rightLegMuscle: 11.4,
      leftArmFat: 0.8,
      rightArmFat: 0.9,
      trunkFat: 7.2,
      leftLegFat: 3.4,
      rightLegFat: 3.3,
      deviceName: 'LeFu Scale Pro',
      source: 'lefu_scale' as const,
    };

    try {
      await saveMeasurementMutation.mutateAsync(mockLeFuData);
      setLefuStatus('idle');
      toast({
        title: "LeFu Measurement Complete",
        description: "58+ body metrics captured and saved successfully",
      });
    } catch (error) {
      setLefuStatus('error');
      toast({
        title: "Measurement Save Error",
        description: "Failed to save LeFu measurement data",
        variant: "destructive",
      });
    }
  };

  const saveMeasurementMutation = useMutation({
    mutationFn: async (data: Partial<Measurement>) => {
      const response = await apiRequest('POST', '/api/measurements', data);
      if (!response.ok) {
        throw new Error('Failed to save measurement');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setShowForm(false);
      setFormData({});
      toast({
        title: "Success",
        description: "Measurements saved successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save measurements. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof Measurement, value: string) => {
    const numValue = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? undefined : numValue
    }));
  };

  const handleSubmit = () => {
    const hasData = Object.values(formData).some(value => value !== undefined && value !== '');
    if (!hasData) {
      toast({
        title: "No Data",
        description: "Please enter at least one measurement.",
        variant: "destructive",
      });
      return;
    }

    const convertedData = { ...formData };
    
    if (unitSystem === 'imperial') {
      if (convertedData.weight) {
        convertedData.weight = convertWeight(Number(convertedData.weight), 'lbs', 'kg');
      }
      if (convertedData.muscleMass) {
        convertedData.muscleMass = convertWeight(Number(convertedData.muscleMass), 'lbs', 'kg');
      }
      if (convertedData.squatMax) {
        convertedData.squatMax = convertWeight(Number(convertedData.squatMax), 'lbs', 'kg');
      }
      if (convertedData.benchMax) {
        convertedData.benchMax = convertWeight(Number(convertedData.benchMax), 'lbs', 'kg');
      }
      if (convertedData.deadliftMax) {
        convertedData.deadliftMax = convertWeight(Number(convertedData.deadliftMax), 'lbs', 'kg');
      }
      const circumferenceFields = ['neck', 'chest', 'waist', 'hips', 'upperArmLeft', 'upperArmRight', 
                                   'forearmLeft', 'forearmRight', 'thighLeft', 'thighRight', 'calfLeft', 'calfRight'];
      circumferenceFields.forEach(field => {
        if (convertedData[field as keyof typeof convertedData]) {
          convertedData[field as keyof typeof convertedData] = convertLength(Number(convertedData[field as keyof typeof convertedData]), 'in', 'cm');
        }
      });
      if (convertedData.verticalJump) {
        convertedData.verticalJump = convertLength(Number(convertedData.verticalJump), 'in', 'cm');
      }
    }

    saveMeasurementMutation.mutate(convertedData);
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
        <View style={styles.headerContainer}>
          <Ruler size={32} color="black" />
          <View>
            <Text style={styles.title}>Measurements</Text>
            <Text style={styles.subtitle}>Track your body composition and progress</Text>
          </View>
          <Button onPress={() => setShowForm(!showForm)} style={styles.addButton}>
            <Plus size={16} color="white" />
            <Text style={styles.buttonText}>{showForm ? 'Cancel' : 'Add Measurement'}</Text>
          </Button>
        </View>

        <Card style={styles.lefuCard}>
          <CardHeader>
            <CardTitle style={styles.lefuCardTitle}>
              <Scale size={24} color="#2563EB" />
              <Text>LeFu Smart Scale Integration</Text>
              <Badge variant="secondary" style={styles.lefuBadge}>Phase 3 Ready</Badge>
            </CardTitle>
            <Text style={styles.lefuDescription}>
              Real-time device communication with Web Bluetooth API
            </Text>
            <View style={styles.lefuCompatibleDevices}>
              <Text style={styles.lefuCompatibleDevicesTitle}>Compatible Devices:</Text>
              <Text style={styles.lefuCompatibleDevicesText}>
                LeFu body composition scales with 8-electrode technology, Bluetooth connectivity, and 58+ body metrics support.
              </Text>
            </View>
          </CardHeader>
          <CardContent style={styles.lefuCardContent}>
            <View style={styles.lefuStatusContainer}>
              <View style={styles.lefuStatusTextContainer}>
                <Bluetooth size={16} color="#2563EB" />
                <Text style={styles.lefuStatusText}>
                  {bluetoothSupported ? "Bluetooth Ready" : "Bluetooth Not Supported"}
                </Text>
                {bluetoothSupported ? (
                  <CheckCircle size={16} color="green" />
                ) : (
                  <AlertCircle size={16} color="red" />
                )}
              </View>
              <Text style={styles.lefuStatusSubText}>
                {bluetoothSupported
                  ? "Web Bluetooth API ready for device communication"
                  : "Web Bluetooth not supported in this browser"}
              </Text>
            </View>
            <Button
              onPress={scanForLeFuDevices}
              disabled={!bluetoothSupported || lefuStatus === 'scanning' || lefuStatus === 'connecting'}
              variant="outline"
              style={styles.lefuButton}
            >
              {lefuStatus === 'scanning' || lefuStatus === 'connecting' ? (
                <ActivityIndicator size="small" color="black" />
              ) : (
                <Bluetooth size={16} color="black" />
              )}
              <Text style={styles.buttonText}>
                {lefuStatus === 'scanning' ? "Scanning..." : lefuStatus === 'connecting' ? "Connecting..." : "Connect LeFu Scale"}
              </Text>
            </Button>

            <View style={styles.lefuDemoContainer}>
              <View style={styles.lefuDemoTextContainer}>
                <Zap size={16} color="orange" />
                <Text style={styles.lefuDemoText}>Demo Measurement</Text>
              </View>
              <Text style={styles.lefuDemoSubText}>
                Simulate LeFu scale measurement (3-second process)
              </Text>
              <Button
                onPress={simulateLeFuMeasurement}
                disabled={lefuStatus === 'measuring'}
                style={styles.lefuButton}
              >
                {lefuStatus === 'measuring' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Scale size={16} color="white" />
                )}
                <Text style={styles.buttonText}>Start Demo</Text>
              </Button>
            </View>

            {lefuStatus === 'measuring' && (
              <View style={styles.lefuMeasuringContainer}>
                <Text style={styles.lefuMeasuringText}>
                  Step on scale and remain still for accurate measurement...
                </Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressBarFill} />
                </View>
              </View>
            )}

            {lefuDevice && lefuStatus === 'idle' && (
              <View style={styles.lefuConnectedContainer}>
                <CheckCircle size={16} color="green" />
                <Text style={styles.lefuConnectedText}>
                  LeFu Scale connected and ready for measurements
                </Text>
              </View>
            )}

            {lefuStatus === 'error' && (
              <View style={styles.lefuErrorContainer}>
                <AlertCircle size={16} color="red" />
                <Text style={styles.lefuErrorText}>
                  Connection failed. Try the troubleshooting steps below.
                </Text>
                <View style={styles.lefuTroubleshooting}>
                  <Text style={styles.lefuTroubleshootingTitle}>Troubleshooting Tips:</Text>
                  <Text style={styles.lefuTroubleshootingText}>
                    • Make sure your LeFu scale is powered on and ready for pairing
                    • Step on the scale briefly to wake it up, then step off
                    • Grant Bluetooth permissions when prompted
                    • Use the "Start Demo" button to test functionality without a physical device
                  </Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <Card style={styles.formCard}>
            <CardHeader>
              <View style={styles.formHeader}>
                <CardTitle>New Measurement Entry</CardTitle>
                <View style={styles.unitSystemContainer}>
                  <Label>Unit System:</Label>
                  <Select
                    onValueChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}
                    items={[
                      { label: 'Imperial', value: 'imperial' },
                      { label: 'Metric', value: 'metric' },
                    ]}
                    placeholder={{ label: 'Select unit', value: null }}
                  />
                  <Text style={styles.unitSystemText}>
                    {unitSystem === 'imperial' ? 'lbs, inches' : 'kg, cm'}
                  </Text>
                </View>
              </View>
            </CardHeader>
            <CardContent style={styles.formContent}>
              <View>
                <Text style={styles.sectionTitle}>Body Composition</Text>
                <View style={styles.formGrid}>
                  <View>
                    <Label>Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.weight?.toString() || ''}
                      onChangeText={(text) => handleInputChange('weight', text)}
                    />
                  </View>
                  <View>
                    <Label>Body Fat %</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.bodyFat?.toString() || ''}
                      onChangeText={(text) => handleInputChange('bodyFat', text)}
                    />
                  </View>
                  <View>
                    <Label>BMI</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.bmi?.toString() || ''}
                      onChangeText={(text) => handleInputChange('bmi', text)}
                    />
                  </View>
                  <View>
                    <Label>Muscle Mass ({unitSystem === 'imperial' ? 'lbs' : 'kg'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.muscleMass?.toString() || ''}
                      onChangeText={(text) => handleInputChange('muscleMass', text)}
                    />
                  </View>
                  <View>
                    <Label>Total Body Water %</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.totalBodyWater?.toString() || ''}
                      onChangeText={(text) => handleInputChange('totalBodyWater', text)}
                    />
                  </View>
                  <View>
                    <Label>BMR (calories)</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.bmr?.toString() || ''}
                      onChangeText={(text) => handleInputChange('bmr', text)}
                    />
                  </View>
                </View>
              </View>

              <Separator />

              <View>
                <Text style={styles.sectionTitle}>Key Circumferences ({unitSystem === 'imperial' ? 'inches' : 'cm'})</Text>
                <View style={styles.formGrid}>
                  <View>
                    <Label>Neck</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.neck?.toString() || ''}
                      onChangeText={(text) => handleInputChange('neck', text)}
                    />
                  </View>
                  <View>
                    <Label>Chest</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.chest?.toString() || ''}
                      onChangeText={(text) => handleInputChange('chest', text)}
                    />
                  </View>
                  <View>
                    <Label>Waist</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.waist?.toString() || ''}
                      onChangeText={(text) => handleInputChange('waist', text)}
                    />
                  </View>
                  <View>
                    <Label>Hips/Glutes</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.hips?.toString() || ''}
                      onChangeText={(text) => handleInputChange('hips', text)}
                    />
                  </View>
                  <View>
                    <Label>Upper Arm (Left)</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.upperArmLeft?.toString() || ''}
                      onChangeText={(text) => handleInputChange('upperArmLeft', text)}
                    />
                  </View>
                  <View>
                    <Label>Thigh (Left)</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.thighLeft?.toString() || ''}
                      onChangeText={(text) => handleInputChange('thighLeft', text)}
                    />
                  </View>
                </View>
              </View>

              <Separator />

              <View>
                <Text style={styles.sectionTitle}>Strength & Performance</Text>
                <View style={styles.formGrid}>
                  <View>
                    <Label>Squat 1-Rep Max ({unitSystem === 'imperial' ? 'lbs' : 'kg'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.squatMax?.toString() || ''}
                      onChangeText={(text) => handleInputChange('squatMax', text)}
                    />
                  </View>
                  <View>
                    <Label>Bench Press 1-Rep Max ({unitSystem === 'imperial' ? 'lbs' : 'kg'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.benchMax?.toString() || ''}
                      onChangeText={(text) => handleInputChange('benchMax', text)}
                    />
                  </View>
                  <View>
                    <Label>Deadlift 1-Rep Max ({unitSystem === 'imperial' ? 'lbs' : 'kg'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.deadliftMax?.toString() || ''}
                      onChangeText={(text) => handleInputChange('deadliftMax', text)}
                    />
                  </View>
                  <View>
                    <Label>Push-ups/minute</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.pushupCount?.toString() || ''}
                      onChangeText={(text) => handleInputChange('pushupCount', text)}
                    />
                  </View>
                  <View>
                    <Label>Plank Hold (seconds)</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.plankTime?.toString() || ''}
                      onChangeText={(text) => handleInputChange('plankTime', text)}
                    />
                  </View>
                  <View>
                    <Label>Vertical Jump ({unitSystem === 'imperial' ? 'inches' : 'cm'})</Label>
                    <Input
                      keyboardType="numeric"
                      value={formData.verticalJump?.toString() || ''}
                      onChangeText={(text) => handleInputChange('verticalJump', text)}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formButtons}>
                <Button
                  onPress={handleSubmit}
                  disabled={saveMeasurementMutation.isPending}
                  style={styles.saveButton}
                >
                  <Text style={styles.buttonText}>
                    {saveMeasurementMutation.isPending ? "Saving..." : "Save Measurements"}
                  </Text>
                </Button>
                <Button onPress={() => setShowForm(false)} variant="outline">
                  <Text style={styles.buttonText}>Cancel</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        <Card style={styles.historyCard}>
          <CardHeader>
            <View style={styles.historyHeader}>
              <CardTitle>Measurement History</CardTitle>
              <Text style={styles.unitSystemDisplay}>
                Displaying in {unitSystem === 'imperial' ? 'Imperial (lbs, inches)' : 'Metric (kg, cm)'}
              </Text>
            </View>
          </CardHeader>
          <CardContent>
            {measurements.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Activity size={48} color="gray" style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateText}>No measurements recorded yet</Text>
                <Text style={styles.emptyStateSubText}>Add your first measurement to start tracking progress</Text>
              </View>
            ) : (
              <View style={styles.measurementsList}>
                {measurements.map((measurement: Measurement) => (
                  <View key={measurement.id} style={styles.measurementItem}>
                    <View style={styles.measurementItemHeader}>
                      <Text style={styles.measurementDate}>
                        {measurement.timestamp ? format(new Date(measurement.timestamp), "MMMM d, yyyy") : "Recent"}
                      </Text>
                      <Text style={styles.measurementTime}>
                        {measurement.timestamp ? format(new Date(measurement.timestamp), "h:mm a") : ""}
                      </Text>
                    </View>
                    {measurement.source === 'lefu_scale' && (
                      <View style={styles.lefuSourceBadgeContainer}>
                        <Badge variant="outline" style={styles.lefuSourceBadge}>
                          <Scale size={12} color="black" />
                          <Text style={styles.lefuSourceBadgeText}>LeFu Scale</Text>
                        </Badge>
                        <Text style={styles.lefuSourceDeviceName}>{measurement.deviceName}</Text>
                      </View>
                    )}
                    
                    <View style={styles.measurementGrid}>
                      {measurement.weight && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Weight:</Text>
                          <Text>{formatWeight(measurement.weight, unitSystem)}</Text>
                        </View>
                      )}
                      {measurement.bodyFat && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Body Fat:</Text>
                          <Text>{measurement.bodyFat}%</Text>
                        </View>
                      )}
                      {measurement.bmi && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>BMI:</Text>
                          <Text>{measurement.bmi}</Text>
                        </View>
                      )}
                      {measurement.muscleMass && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Muscle Mass:</Text>
                          <Text>{formatWeight(measurement.muscleMass, unitSystem)}</Text>
                        </View>
                      )}
                      {measurement.visceralFat && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Visceral Fat:</Text>
                          <Text>{measurement.visceralFat}</Text>
                        </View>
                      )}
                      {measurement.totalBodyWater && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Body Water:</Text>
                          <Text>{measurement.totalBodyWater}%</Text>
                        </View>
                      )}
                      {measurement.bmr && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>BMR:</Text>
                          <Text>{measurement.bmr} cal</Text>
                        </View>
                      )}
                      {measurement.metabolicAge && (
                        <View style={styles.measurementGridItem}>
                          <Text style={styles.measurementLabel}>Metabolic Age:</Text>
                          <Text>{measurement.metabolicAge} yrs</Text>
                        </View>
                      )}
                    </View>

                    {measurement.source === 'lefu_scale' && (measurement.leftArmMuscle || measurement.leftArmFat) && (
                      <View style={styles.segmentalAnalysisContainer}>
                        <Text style={styles.segmentalAnalysisTitle}>
                          <TrendingUp size={16} color="black" />
                          <Text>Segmental Analysis</Text>
                        </Text>
                        <View style={styles.segmentalAnalysisGrid}>
                          {(measurement.leftArmMuscle || measurement.rightArmMuscle || measurement.trunkMuscle) && (
                            <View style={styles.segmentalAnalysisColumn}>
                              <Text style={styles.segmentalAnalysisColumnTitle}>MUSCLE MASS (kg)</Text>
                              {measurement.leftArmMuscle && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Left Arm:</Text>
                                  <Text>{measurement.leftArmMuscle}</Text>
                                </View>
                              )}
                              {measurement.rightArmMuscle && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Right Arm:</Text>
                                  <Text>{measurement.rightArmMuscle}</Text>
                                </View>
                              )}
                              {measurement.trunkMuscle && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Trunk:</Text>
                                  <Text>{measurement.trunkMuscle}</Text>
                                </View>
                              )}
                              {measurement.leftLegMuscle && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Left Leg:</Text>
                                  <Text>{measurement.leftLegMuscle}</Text>
                                </View>
                              )}
                              {measurement.rightLegMuscle && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Right Leg:</Text>
                                  <Text>{measurement.rightLegMuscle}</Text>
                                </View>
                              )}
                            </View>
                          )}

                          {(measurement.leftArmFat || measurement.rightArmFat || measurement.trunkFat) && (
                            <View style={styles.segmentalAnalysisColumn}>
                              <Text style={styles.segmentalAnalysisColumnTitle}>FAT MASS (kg)</Text>
                              {measurement.leftArmFat && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Left Arm:</Text>
                                  <Text>{measurement.leftArmFat}</Text>
                                </View>
                              )}
                              {measurement.rightArmFat && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Right Arm:</Text>
                                  <Text>{measurement.rightArmFat}</Text>
                                </View>
                              )}
                              {measurement.trunkFat && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Trunk:</Text>
                                  <Text>{measurement.trunkFat}</Text>
                                </View>
                              )}
                              {measurement.leftLegFat && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Left Leg:</Text>
                                  <Text>{measurement.leftLegFat}</Text>
                                </View>
                              )}
                              {measurement.rightLegFat && (
                                <View style={styles.segmentalAnalysisItem}>
                                  <Text>Right Leg:</Text>
                                  <Text>{measurement.rightLegFat}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  buttonText: {
    color: "white",
  },
  lefuCard: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    marginBottom: 24,
  },
  lefuCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  lefuBadge: {
    marginLeft: 10,
  },
  lefuDescription: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  lefuCompatibleDevices: {
    backgroundColor: "#E0F2FE",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  lefuCompatibleDevicesTitle: {
    fontWeight: "bold",
    color: "#1D4ED8",
    marginBottom: 5,
  },
  lefuCompatibleDevicesText: {
    color: "#1E40AF",
    fontSize: 12,
  },
  lefuCardContent: {
    paddingTop: 10,
  },
  lefuStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  lefuStatusTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  lefuStatusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lefuStatusSubText: {
    fontSize: 12,
    color: "gray",
  },
  lefuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  lefuDemoContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "white",
    marginTop: 20,
  },
  lefuDemoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  lefuDemoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lefuDemoSubText: {
    fontSize: 12,
    color: "gray",
    marginBottom: 10,
  },
  lefuMeasuringContainer: {
    marginTop: 15,
  },
  lefuMeasuringText: {
    fontSize: 12,
    color: "gray",
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  progressBarFill: {
    width: "60%", // Example progress
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  lefuConnectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 15,
  },
  lefuConnectedText: {
    color: "green",
    fontSize: 14,
  },
  lefuErrorContainer: {
    marginTop: 15,
  },
  lefuErrorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  lefuTroubleshooting: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  lefuTroubleshootingTitle: {
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 5,
  },
  lefuTroubleshootingText: {
    color: "#B91C1C",
    fontSize: 12,
  },
  formCard: {
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitSystemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unitSystemText: {
    fontSize: 12,
    color: "gray",
  },
  formContent: {
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  formButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
  },
  historyCard: {
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitSystemDisplay: {
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
  emptyStateText: {
    fontSize: 16,
    color: "gray",
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
  },
  measurementsList: {
    marginTop: 10,
  },
  measurementItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  measurementItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  measurementDate: {
    fontWeight: "bold",
  },
  measurementTime: {
    fontSize: 12,
    color: "gray",
  },
  lefuSourceBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  lefuSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E0F2FE",
    borderColor: "#BFDBFE",
  },
  lefuSourceBadgeText: {
    fontSize: 12,
    color: "#1D4ED8",
  },
  lefuSourceDeviceName: {
    fontSize: 12,
    color: "gray",
    marginLeft: 10,
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  measurementGridItem: {
    width: "48%",
    marginBottom: 10,
  },
  measurementLabel: {
    color: "gray",
  },
  segmentalAnalysisContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  segmentalAnalysisTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  segmentalAnalysisGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segmentalAnalysisColumn: {
    width: "48%",
  },
  segmentalAnalysisColumnTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
    marginBottom: 5,
  },
  segmentalAnalysisItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
});
