import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import { Platform, View, Text, Pressable } from "react-native";
import { useJob } from "@/lib/job-context";
import { palette, brand } from "@/constants/theme";

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={18} style={{ marginBottom: -2 }} {...props} />;
}

function HeaderLogo() {
  return (
    <View style={{ paddingLeft: 16, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "900", fontStyle: "italic", color: "#ffffff", letterSpacing: -0.5 }}>
        SIGNAL
      </Text>
      <View style={{ width: 12, height: 3, backgroundColor: brand.orange, borderRadius: 1, marginLeft: 3, marginBottom: 1 }} />
    </View>
  );
}

function NewJobButton() {
  const { runNewJob } = useJob();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        runNewJob();
        router.navigate("/jobfit");
      }}
      style={({ pressed }) => ({
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "rgba(254,176,106,0.12)",
        borderWidth: 1,
        borderColor: "rgba(254,176,106,0.30)",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontSize: 11, fontWeight: "900", color: brand.orange }}>+ New Job</Text>
    </Pressable>
  );
}

function HowToUseLink() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/instructions")}
      style={({ pressed }) => ({ paddingHorizontal: 8, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: brand.blue }}>How to Use</Text>
    </Pressable>
  );
}

/** Header right for the 4 tool tabs — shows + New Job and How to Use */
function ToolHeaderRight() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 8, gap: 4 }}>
      <NewJobButton />
      <HowToUseLink />
    </View>
  );
}

/** Header right for Tracker and Profile — How to Use only */
function PlainHeaderRight() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 8 }}>
      <HowToUseLink />
    </View>
  );
}

export default function TabLayout() {
  const headerBase = {
    headerShown: true,
    headerStyle: {
      backgroundColor: palette.bg,
      borderBottomWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    headerTitleStyle: { color: palette.bg, fontSize: 0 },
    headerLeft: () => <HeaderLogo />,
  } as const;

  return (
    <Tabs
      screenOptions={{
        ...headerBase,
        headerRight: () => <ToolHeaderRight />,
        tabBarPosition: "bottom",
        tabBarStyle: {
          backgroundColor: palette.navBg,
          borderTopColor: palette.borderSoft,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 : 60,
          paddingBottom: Platform.OS === "ios" ? 24 : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: brand.orange,
        tabBarInactiveTintColor: palette.dim,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "800",
          letterSpacing: 0.2,
        },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color }) => <TabIcon name="list-alt" color={color} />,
          headerRight: () => <PlainHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="jobfit"
        options={{
          title: "Job Fit",
          tabBarIcon: ({ color }) => <TabIcon name="crosshairs" color={color} />,
        }}
      />
      <Tabs.Screen
        name="positioning"
        options={{
          title: "Position",
          tabBarIcon: ({ color }) => <TabIcon name="pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coverletter"
        options={{
          title: "Letter",
          tabBarIcon: ({ color }) => <TabIcon name="file-text-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="networking"
        options={{
          title: "Network",
          tabBarIcon: ({ color }) => <TabIcon name="share-alt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="user-circle-o" color={color} />,
          headerRight: () => <PlainHeaderRight />,
        }}
      />
    </Tabs>
  );
}
