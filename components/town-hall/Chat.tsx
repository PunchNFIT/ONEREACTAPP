import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { format } from "date-fns";
import { Send } from "@expo/vector-icons";
import { apiRequest, queryClient } from "../../lib/queryClient";
import * as Linking from 'expo-linking';

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

function renderContent(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+\.[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (
      part.startsWith("http://") ||
      part.startsWith("https://") ||
      part.startsWith("/")
    ) {
      return (
        <Text
          key={index}
          style={styles.linkText}
          onPress={() => Linking.openURL(part)}
        >
          {part}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
}

export function Chat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat", { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
    },
  });

  const handleSubmit = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
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
      <ScrollView style={styles.messagesContainer}>
        <View style={styles.messagesContent}>
          {messages?.map((msg) => (
            <Card
              key={msg.id}
              style={[
                styles.messageCard,
                msg.userId === user?.id ? styles.myMessageCard : styles.otherMessageCard,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.username}>{msg.username}</Text>
                <Text style={styles.timestamp}>
                  {msg.createdAt
                    ? format(new Date(msg.createdAt), "HH:mm")
                    : "Invalid time"}
                </Text>
              </View>
              <Text style={styles.messageContent}>{renderContent(msg.content)}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
        />
        <Button onPress={handleSubmit} size="icon">
          <Send name="send" size={16} color="white" />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  container: {
    flex: 1,
    height: 400,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: "80%",
  },
  myMessageCard: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  otherMessageCard: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: "gray",
  },
  messageContent: {
    fontSize: 14,
  },
  linkText: {
    color: "blue",
    textDecorationLine: "underline",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
});
