import { HapticTab } from "@/components/haptic-tab";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 80,
          borderTopWidth: 0,
          elevation: 10,
          paddingTop: 0,
          paddingBottom: 0,
          backgroundColor: "#ffffff",
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "gray",
        headerShadowVisible: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="home"
              size={24}
              color={focused ? "#16a34a" : "gray"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="stats-chart"
              size={24}
              color={focused ? "#16a34a" : "gray"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarStyle: { display: "none" },
          tabBarButton: (props) => {
            const {
              ref,
              disabled,
              style,
              onBlur,
              onFocus,
              onPress,
              onPressIn,
              onPressOut,
              onLongPress,
              ...rest
            } = props;
            return (
              <TouchableOpacity
                {...rest}
                disabled={disabled ?? false}
                onBlur={onBlur ?? undefined}
                onFocus={onFocus ?? undefined}
                onPress={onPress ?? undefined}
                onPressIn={onPressIn ?? undefined}
                onPressOut={onPressOut ?? undefined}
                onLongPress={onLongPress ?? undefined}
                style={[
                  {
                    top: -25,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                  style,
                ]}
                delayLongPress={500}
              >
                <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-md">
                  <View className="w-16 h-16 bg-green-600 rounded-full items-center justify-center">
                    <Ionicons name="camera" size={28} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="chatbox-ellipses-outline"
              size={24}
              color={focused ? "#16a34a" : "gray"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="materials-guide"
        options={{
          title: "Panduan",
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="info-circle"
              size={24}
              color={focused ? "#16a34a" : "gray"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
