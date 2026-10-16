import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider, useProfiles } from './context/ProfileContext';
import ProfilesScreen from './screens/ProfilesScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import WorldMapScreen from './screens/WorldMapScreen';
import SkillListScreen from './screens/SkillListScreen';
import QuizScreen from './screens/QuizScreen';
import ResultsScreen from './screens/ResultsScreen';
import MemoryGameScreen from './screens/MemoryGameScreen';
import GameSetupScreen from './screens/GameSetupScreen';
import PathRaceScreen from './screens/PathRaceScreen';
import MiniGamesScreen from './screens/MiniGamesScreen';
import BubblePopScreen from './screens/BubblePopScreen';
import ChipTossScreen from './screens/ChipTossScreen';
import DanceTapScreen from './screens/DanceTapScreen';
import FreezeZooScreen from './screens/FreezeZooScreen';
import RoboPathScreen from './screens/RoboPathScreen';
import PushRollScreen from './screens/PushRollScreen';
import GardenScreen from './screens/GardenScreen';
import FeelingsFriendsScreen from './screens/FeelingsFriendsScreen';
import BalloonBreathScreen from './screens/BalloonBreathScreen';
import StickerBookScreen from './screens/StickerBookScreen';
import ParentDashboardScreen from './screens/ParentDashboardScreen';
import TimeUpScreen from './screens/TimeUpScreen';
import AdventureScreen from './screens/AdventureScreen';
import { colors } from './utils/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <AppNavigator />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

// Reports the current screen to the profile context, which counts play time
// only on playing screens.
function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const { setActiveRoute } = useProfiles();
  const reportRoute = () => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? null);

  return (
    <NavigationContainer ref={navigationRef} onReady={reportRoute} onStateChange={reportRoute}>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Profiles"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Profiles" component={ProfilesScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="WorldMap" component={WorldMapScreen} />
        <Stack.Screen name="SkillList" component={SkillListScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="GameSetup" component={GameSetupScreen} />
        <Stack.Screen name="Memory" component={MemoryGameScreen} />
        <Stack.Screen name="PathRace" component={PathRaceScreen} />
        <Stack.Screen name="MiniGames" component={MiniGamesScreen} />
        <Stack.Screen name="BubblePop" component={BubblePopScreen} />
        <Stack.Screen name="ChipToss" component={ChipTossScreen} />
        <Stack.Screen name="DanceTap" component={DanceTapScreen} />
        <Stack.Screen name="FreezeZoo" component={FreezeZooScreen} />
        <Stack.Screen name="RoboPath" component={RoboPathScreen} />
        <Stack.Screen name="PushRoll" component={PushRollScreen} />
        <Stack.Screen name="Garden" component={GardenScreen} />
        <Stack.Screen name="FeelingsFriends" component={FeelingsFriendsScreen} />
        <Stack.Screen name="BalloonBreath" component={BalloonBreathScreen} />
        <Stack.Screen name="StickerBook" component={StickerBookScreen} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
        <Stack.Screen name="TimeUp" component={TimeUpScreen} />
        <Stack.Screen name="Adventure" component={AdventureScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
