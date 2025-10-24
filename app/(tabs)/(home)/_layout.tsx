
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Bills',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-bill"
        options={{
          title: 'Add Bill',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="bill-details"
        options={{
          title: 'Bill Details',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
