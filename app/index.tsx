import { ThemedText, ThemedView } from "../components";

export default function Index() {
  return (
    <ThemedView className="flex-1 items-center justify-center" backgroundColor="secondary50">
      <ThemedText 
        variant="title" 
        color="primary600" 
        className="text-center mb-4"
      >
        Welcome to WanderLanka!
      </ThemedText>
      <ThemedText 
        variant="subtitle" 
        color="secondary600" 
        className="text-center"
      >
        Your Sri Lankan Travel Companion
      </ThemedText>
    </ThemedView>
  );
}
