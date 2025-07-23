import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Loader2,
  Send,
  Dumbbell,
  Timer,
  Apple,
  Image as ImageIcon,
  X,
  Mic,
  Volume2,
  VolumeX,
  Target,
  MapPin,
} from "@expo/vector-icons";
import { useAuth } from "../hooks/use-auth";
import { Select, SelectItem } from "../components/ui/Select";
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

type Message = {
  question: string;
  answer: string;
  relatedTopics: string[];
  imagePath?: string;
  audioUrl?: string;
};

type AIResponse = {
  answer: string;
  relatedTopics: string[];
  audioUrl?: string;
};

const VOICE_OPTIONS = [
  { value: "Seun", label: "Seun - My Personal Coach" },
  { value: "voice2", label: "Adam - Versatile Coach" },
  { value: "voice3", label: "Antoni - British Coach" },
  { value: "voice4", label: "Arnold - Motivational" },
  { value: "voice5", label: "Bella - Supportive Female" },
  { value: "voice6", label: "Rachel - Natural Voice" },
];

// Placeholder for Switch component
const Switch = ({ value, onValueChange, id }) => (
  <TouchableOpacity onPress={() => onValueChange(!value)}>
    <View style={[
      styles.switchContainer,
      value ? styles.switchActive : styles.switchInactive
    ]}>
      <View style={[
        styles.switchThumb,
        value ? styles.switchThumbActive : styles.switchThumbInactive
      ]} />
    </View>
  </TouchableOpacity>
);

const Label = ({ children, htmlFor }) => <Text style={styles.label}>{children}</Text>;

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [voiceType, setVoiceType] = useState("Seun");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  const { toast } = useToast();
  const form = useForm<{ question: string }>();
  const { user } = useAuth();

  const { data: conversationHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['/api/ai-coach-conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-coach-conversations');
      return response.json();
    },
  });

  useEffect(() => {
    if (conversationHistory && conversationHistory.length > 0) {
      setMessages(conversationHistory);
    }
  }, [conversationHistory]);

  useEffect(() => {
    return currentSound
      ? () => {
          currentSound.unloadAsync();
        }
      : undefined;
  }, [currentSound]);

  const aiMutation = useMutation({
    mutationFn: async (data: {
      question: string;
      image?: any;
      voiceEnabled?: boolean;
      location?: string;
    }) => {
      const needsLocation = containsLocationTerms(data.question);
      const hasLocation = userLocation !== null;

      if (needsLocation && !hasLocation) {
        console.log("🌍 Location-based query detected, proceeding without location");
      }

      if (data.image) {
        const formData = new FormData();
        formData.append("question", data.question);
        formData.append("image", {
          uri: data.image.uri,
          name: data.image.fileName || 'image.jpg',
          type: data.image.type || 'image/jpeg',
        } as any);
        if (needsLocation && userLocation) {
          formData.append("location", userLocation);
        }

        const res = await fetch(`${API_BASE_URL}/api/ai-coach-image`, {
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!res.ok) throw new Error("Network response was not ok");
        return res.json() as Promise<AIResponse & { imagePath: string }>;
      } else if (data.voiceEnabled) {
        const payload: any = {
          question: data.question,
          voiceType: voiceType,
        };

        if (needsLocation && userLocation) {
          payload.location = userLocation;
        }

        const res = await apiRequest("POST", "/api/ai-coach-voice", payload);
        return res.json() as Promise<AIResponse & { audioUrl: string }>;
      } else {
        const res = await apiRequest("POST", "/api/ai-coach", {
          question: data.question,
        });
        return res.json() as Promise<AIResponse>;
      }
    },
    onSuccess: async (data, variables) => {
      const newMessage: Message = {
        question: variables.question,
        answer: data.answer,
        relatedTopics: data.relatedTopics || [],
        imagePath: "imagePath" in data ? data.imagePath as string : undefined,
        audioUrl: "audioUrl" in data ? data.audioUrl : undefined,
      };
      setMessages((prev) => [...prev, newMessage]);

      queryClient.invalidateQueries({ queryKey: ['/api/ai-coach-conversations'] });

      // Auto-detect and save workout plans (simplified for RN)
      // if (data.answer && typeof data.answer === 'string' && detectWorkoutPlan(data.answer)) {
      //   // ... logic to save workout plan ...
      // }

      // Auto-detect and save meal plans (simplified for RN)
      // if (data.answer && typeof data.answer === 'string' && detectMealPlan(data.answer)) {
      //   // ... logic to save meal plan ...
      // }

      if (variables.voiceEnabled && data.audioUrl) {
        playAudio(data.audioUrl);
      } else if (variables.voiceEnabled) {
        Speech.speak(data.answer, { voice: voiceType });
      }
      form.reset();
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImagePreview(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
      toast({
        title: "Input Required",
        description: "Please type your question before submitting.",
        variant: "destructive",
      });
      return;
    }

    aiMutation.mutate({
      question: data.question.trim(),
      image: imageFile || undefined,
      voiceEnabled: voiceEnabled,
    });
  });

  const playAudio = async (url: string) => {
    if (currentSound) {
      await currentSound.unloadAsync();
    }
    const { sound } = await Audio.Sound.createAsync({ uri: url });
    setCurrentSound(sound);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
    setIsPlaying(true);
  };

  const toggleAudio = async (audioUrl?: string) => {
    if (!audioUrl) return;

    if (isPlaying && currentSound) {
      await currentSound.pauseAsync();
      setIsPlaying(false);
    } else {
      playAudio(audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Permission to access microphone is required!",
          variant: "destructive",
        });
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setIsRecording(true);
      // mediaRecorderRef.current = recording;

      toast({
        title: "Recording",
        description: "Speak your question...",
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      toast({
        title: "Microphone Error",
        description: "Unable to access your microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    // if (!mediaRecorderRef.current) return;
    // await mediaRecorderRef.current.stopAndUnloadAsync();
    // const uri = mediaRecorderRef.current.getURI();
    // if (uri) {
    //   sendAudioToServer(uri);
    // }
    setIsRecording(false);
  };

  const sendAudioToServer = async (audioUri: string) => {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);

      toast({
        title: "Processing",
        description: "Analyzing your question...",
      });

      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      form.setValue("question", data.text);

      toast({
        title: "Success",
        description: "Your voice has been converted to text",
      });

      if (data.text && typeof data.text === 'string' && data.text.trim().length > 5) {
        aiMutation.mutate({
          question: data.text.trim(),
          voiceEnabled: voiceEnabled,
        });
      } else if (data.text && data.text.trim().length <= 5) {
        toast({
          title: "Transcription Too Short",
          description: "Please speak a longer question for better accuracy.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your voice input",
        variant: "destructive",
      });
    }
  };

  const getUserLocation = async () => {
    setIsGettingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      toast({
        title: "Location Permission Denied",
        description: "Permission to access location was denied",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    const locationString = `${lat},${lng}`;

    setUserLocation(locationString);
    setIsGettingLocation(false);

    toast({
      title: "Location Enabled",
      description: "Your location will be included in location-based queries.",
    });
  };

  const containsLocationTerms = (query: string): boolean => {
    const locationTerms = ['near me', 'nearby', 'close to me', 'around me', 'in my area', 'local', 'nearest', 'closest', 'find me a', 'find a'];
    const queryLower = query.toLowerCase();
    return locationTerms.some(term => queryLower.includes(term));
  };

  const presetQuestions = [
    {
      label: "Workout Tips",
      question: "What are some effective exercises for building muscle?",
      icon: Dumbbell,
    },
    {
      label: "Cardio Advice",
      question: "How can I improve my running endurance?",
      icon: Timer,
    },
    {
      label: "Nutrition Help",
      question: "What should I eat before and after workouts?",
      icon: Apple,
    },
  ];

  if (loadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.mainContent}>
        <Text style={styles.title}>ONE</Text>

        <View style={styles.chatContainer}>
          <Card style={styles.chatCard}>
            <CardHeader>
              <CardTitle>Chat with ONE</CardTitle>
            </CardHeader>
            <CardContent style={styles.chatContent}>
              <ScrollView style={styles.messagesScrollView}>
                {messages.map((message, index) => (
                  <View key={index} style={styles.messageBubbleContainer}>
                    <View style={styles.myMessageBubble}>
                      <Text style={styles.messageSender}>You</Text>
                      <Text>{message.question}</Text>
                      {message.imagePath && (
                        <Image
                          source={{ uri: message.imagePath }}
                          style={styles.messageImage}
                        />
                      )}
                    </View>
                    <View style={styles.oneMessageBubble}>
                      <View style={styles.oneMessageHeader}>
                        <Text style={styles.messageSender}>ONE</Text>
                        {message.audioUrl && (
                          <TouchableOpacity
                            onPress={() => toggleAudio(message.audioUrl)}
                            style={styles.audioButton}
                          >
                            {isPlaying ? (
                              <VolumeX size={16} color="black" />
                            ) : (
                              <Volume2 size={16} color="black" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text>{message.answer}</Text>
                    </View>
                  </View>
                ))}
                {aiMutation.isPending && (
                  <View style={styles.thinkingContainer}>
                    <Loader2 size={16} color="gray" />
                    <Text style={styles.thinkingText}>Thinking...</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.controlsContainer}>
                <View style={styles.voiceLocationContainer}>
                  <View style={styles.switchLabelContainer}>
                    <Switch
                      id="voice-mode"
                      value={voiceEnabled}
                      onValueChange={setVoiceEnabled}
                    />
                    <Label htmlFor="voice-mode">Voice Mode</Label>
                  </View>

                  {voiceEnabled && (
                    <Select
                      onValueChange={(value) => setVoiceType(value as any)}
                      items={VOICE_OPTIONS.map(option => ({ label: option.label, value: option.value }))}
                      placeholder={{ label: "Select a voice", value: null }}
                    />
                  )}

                  <Button
                    onPress={getUserLocation}
                    disabled={isGettingLocation}
                    style={userLocation ? styles.locationEnabledButton : styles.locationButton}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MapPin size={16} color={userLocation ? "white" : "black"} />
                    )}
                    <Text style={userLocation ? styles.locationEnabledButtonText : styles.locationButtonText}>
                      {userLocation ? "Location Enabled" : "Use My Location"}
                    </Text>
                  </Button>
                </View>

                {imagePreview && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                    <TouchableOpacity onPress={clearImage} style={styles.clearImageButton}>
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputButtonContainer}>
                  <Controller
                    control={form.control}
                    name="question"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.textInput}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Ask your fitness question..."
                      />
                    )}
                  />

                  <Button onPress={handleImageUpload} variant="outline">
                    <ImageIcon size={16} color="black" />
                  </Button>

                  <Button
                    onPress={isRecording ? stopRecording : startRecording}
                    variant="outline"
                    style={isRecording ? styles.recordingButton : null}
                  >
                    <Mic size={16} color={isRecording ? "red" : "black"} />
                  </Button>

                  <Button onPress={handleSubmit} disabled={aiMutation.isPending}>
                    <Send size={16} color="white" />
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>

          <View style={styles.quickAccessContainer}>
            {presetQuestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAccessCard}
                onPress={() => { /* Navigate to relevant page */ }}
              >
                <CardContent style={styles.quickAccessCardContent}>
                  <item.icon size={48} color="black" />
                  <Text style={styles.quickAccessCardTitle}>{item.label}</Text>
                  <Text style={styles.quickAccessCardDescription}>{item.question}</Text>
                </CardContent>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
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
  chatContainer: {
    flex: 1,
  },
  chatCard: {
    flex: 1,
    height: "100%",
  },
  chatContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  messagesScrollView: {
    flex: 1,
    paddingRight: 10,
  },
  messageBubbleContainer: {
    marginBottom: 10,
  },
  myMessageBubble: {
    backgroundColor: "#DCF8C6",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-end",
    maxWidth: "90%",
  },
  oneMessageBubble: {
    backgroundColor: "#E5E7EB",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    maxWidth: "90%",
    marginTop: 5,
  },
  messageSender: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  oneMessageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  audioButton: {
    padding: 5,
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  thinkingText: {
    marginLeft: 5,
    color: "gray",
  },
  controlsContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  voiceLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  switchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: "#007BFF",
  },
  switchInactive: {
    backgroundColor: "#CCCCCC",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  switchThumbInactive: {
    transform: [{ translateX: 0 }],
  },
  label: {
    fontSize: 16,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "black",
  },
  locationEnabledButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#007BFF",
  },
  locationButtonText: {
    color: "black",
  },
  locationEnabledButtonText: {
    color: "white",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  clearImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "red",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  inputButtonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  recordingButton: {
    backgroundColor: "#FFCCCC",
  },
  quickAccessContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  quickAccessCard: {
    width: "30%", // Adjust as needed
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  quickAccessCardContent: {
    padding: 15,
    alignItems: "center",
  },
  quickAccessCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  quickAccessCardDescription: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginTop: 5,
  },
});
