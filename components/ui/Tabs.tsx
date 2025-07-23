import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabPress = (value) => {
    setActiveTab(value);
  };

  return (
    <View>
      {React.Children.map(children, (child) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, handleTabPress });
        }
        if (child.type === TabsContent && child.props.value === activeTab) {
          return child;
        }
        return null;
      })}
    </View>
  );
};

const TabsList = ({ children, activeTab, handleTabPress }) => (
  <View style={styles.tabsList}>
    {React.Children.map(children, (child) => {
      return React.cloneElement(child, { activeTab, handleTabPress });
    })}
  </View>
);

const TabsTrigger = ({ value, children, activeTab, handleTabPress }) => (
  <TouchableOpacity
    style={[styles.tab, activeTab === value && styles.activeTab]}
    onPress={() => handleTabPress(value)}
  >
    <Text style={[styles.tabText, activeTab === value && styles.activeTabText]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const TabsContent = ({ children }) => <View>{children}</View>;

const styles = StyleSheet.create({
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tabText: {
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
