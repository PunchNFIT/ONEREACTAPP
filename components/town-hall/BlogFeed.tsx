import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "../../shared/schema";
import { format } from "date-fns";

export function BlogFeed() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {posts?.map((post) => (
        <Card key={post.id} style={styles.card}>
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <Text style={styles.date}>
              {format(new Date(post.createdAt), "MMM d, yyyy")}
            </Text>
          </CardHeader>
          <CardContent>
            <Text>{post.content}</Text>
          </CardContent>
        </Card>
      ))}
    </ScrollView>
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
  },
  card: {
    marginBottom: 16,
  },
  date: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },
});
