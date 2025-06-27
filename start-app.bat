@echo off
echo Divido App Runner

REM Set default IP if not provided as an argument
set IP_ADDRESS=localhost
if not "%~1"=="" set IP_ADDRESS=%~1

echo Setting up the app to use IP: %IP_ADDRESS%

REM Create a temporary file with the updated API URL
echo import axios from 'axios'; > temp_api.ts
echo import AsyncStorage from '@react-native-async-storage/async-storage'; >> temp_api.ts
echo. >> temp_api.ts
echo // API URL set by the startup script >> temp_api.ts
echo export const API_URL = 'http://%IP_ADDRESS%:5000/api'; >> temp_api.ts
echo. >> temp_api.ts
echo // Configure axios defaults >> temp_api.ts
echo axios.defaults.baseURL = API_URL; >> temp_api.ts
echo. >> temp_api.ts
echo // Set up request interceptor to add auth token >> temp_api.ts
echo axios.interceptors.request.use( >> temp_api.ts
echo   async (config) =^> { >> temp_api.ts
echo     const token = await AsyncStorage.getItem('authToken'); >> temp_api.ts
echo     if (token) { >> temp_api.ts
echo       config.headers.Authorization = `Bearer ${token}`; >> temp_api.ts
echo     } >> temp_api.ts
echo     return config; >> temp_api.ts
echo   }, >> temp_api.ts
echo   (error) =^> { >> temp_api.ts
echo     return Promise.reject(error); >> temp_api.ts
echo   } >> temp_api.ts
echo ); >> temp_api.ts
echo. >> temp_api.ts

REM Continue adding the rest of the API file content
type temp_api.ts services\api.ts > services\api.ts.new
move /y services\api.ts.new services\api.ts
del temp_api.ts

echo API configured to use %IP_ADDRESS%

REM Start the backend and frontend in separate windows
start cmd /k "cd backend && npm run dev"
echo Backend server starting...

timeout /t 5 /nobreak

start cmd /k "npx expo start"
echo Expo development server starting...

echo.
echo Divido app is now running!
echo.
echo Backend: http://%IP_ADDRESS%:5000
echo Frontend: Check the Expo window for connection options
echo.
echo To connect from a real device, scan the QR code in the Expo window.
echo.
echo Press Ctrl+C in individual terminal windows to stop the servers.
