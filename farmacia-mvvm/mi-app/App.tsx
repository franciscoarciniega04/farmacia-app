import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import DatabaseService from "./src/services/dataService";
import { initLocalDatabase } from "./src/database/localDb";

const App: React.FC = () => {
  useEffect(() => {
    async function startApp() {
      try {
        await initLocalDatabase();
        await DatabaseService.init();
      } catch (error) {
        console.error("Error inicializando la app:", error);
      }
    }

    startApp();
  }, []);

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default App;