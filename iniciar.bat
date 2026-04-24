@echo off
echo ===============================
echo Iniciando Proyecto
echo ===============================

echo.
echo 1. Iniciando Kafka...
start cmd /k "cd c:\kafka && .\bin\windows\kafka-server-start.bat .\config\server.properties"

timeout /t 20

echo.
echo 2. Iniciando Backend...
start cmd /k "cd backend && node server.js"

timeout /t 20

echo.
echo 3. Iniciando Consumer Kafka...
start cmd /k "cd backend && node consumer.js"

echo.
echo 4. Ejecutando ETL...
start cmd /k "cd backend && node etl.js"

echo.
echo TODO INICIADO
pause