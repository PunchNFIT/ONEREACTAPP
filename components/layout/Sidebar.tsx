import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "expo-router";
import {
  BarChart3,
  User,
  Brain,
  Weight,
  Target,
  Calendar,
  Users,
  LineChart,
  LogOut,
  Menu,
  BookOpen,
  Apple,
  Dumbbell,
  Activity,
  Bell,
  Coins,
} from "@expo/vector-icons";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const clientLinks = [
    { href: "/", label: "ONE", icon: Brain },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/measurements", label: "Measurements", icon: Weight },
    { href: "/rewards", label: "VII-FT Rewards", icon: Coins },
    { href: "/attendance", label: "Attendance", icon: Calendar },
    { href: "/activities", label: "Activities", icon: Activity },
    {
      href: "/notification-settings",
      label: "Notification Settings",
      icon: Bell,
    },
  ];

  const adminLinks = [
    { href: "/admin", label: "Admin Dashboard", icon: BarChart3 },
    { href: "/admin/clients", label: "Manage Clients", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: LineChart },
    { href: "/admin/blog", label: "Manage Blog", icon: BookOpen },
  ];

  const NavigationContent = () => (
    <View style={styles.navigationContent}>
      <View style={styles.section}>
        {user ? (
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarFallback}>
                {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{user.username}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.logoTitle}>
            ONE- AI Fitness Trainer - Agent
          </Text>
        )}

        <View style={styles.linkList}>
          {clientLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              onPress={() => {
                router.push(href);
                setIsMenuOpen(false);
              }}
              style={router.pathname === href ? styles.activeLink : styles.link}
            >
              <Icon name={Icon.name} size={16} color={router.pathname === href ? "white" : "black"} />
              <Text style={router.pathname === href ? styles.activeLinkText : styles.linkText}>
                {label}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      {user?.role === "admin" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <View style={styles.linkList}>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Button
                key={href}
                onPress={() => {
                  router.push(href);
                  setIsMenuOpen(false);
                }}
                style={router.pathname === href ? styles.activeLink : styles.link}
              >
                <Icon name={Icon.name} size={16} color={router.pathname === href ? "white" : "black"} />
                <Text style={router.pathname === href ? styles.activeLinkText : styles.linkText}>
                  {label}
                </Text>
              </Button>
            ))}
          </View>
        </View>
      )}

      <View style={styles.logoutButtonContainer}>
        <Button
          onPress={() => logoutMutation.mutate()}
          style={styles.logoutButton}
        >
          <LogOut name="log-out" size={16} color="black" />
          <Text style={styles.linkText}>Logout</Text>
        </Button>
      </View>
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsMenuOpen(true)}
        style={styles.menuButton}
      >
        <Menu name="menu" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        onRequestClose={() => setIsMenuOpen(false)}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.scrollView}>
              <NavigationContent />
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 100,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  modalContent: {
    width: "80%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  closeButtonText: {
    color: "#007BFF",
    fontSize: 16,
  },
  navigationContent: {
    flex: 1,
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarFallback: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  linkList: {
    marginTop: 5,
  },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeLink: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
  },
  linkText: {
    marginLeft: 10,
    fontSize: 16,
    color: "black",
  },
  activeLinkText: {
    marginLeft: 10,
    fontSize: 16,
    color: "white",
  },
  logoutButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
});
