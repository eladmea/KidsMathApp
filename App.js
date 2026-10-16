import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from './context/ProfileContext';
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
import { colors } from './utils/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <NavigationContainer>
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
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
