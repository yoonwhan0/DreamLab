@echo off

chcp 65001 >nul

cd /d "%~dp0"



echo DreamLab Admin - 연구소 대시보드

echo.



if not exist "node_modules\" (

  echo npm install...

  call npm install || pause & exit /b 1

)



call node scripts\sync-branch-env.mjs

if errorlevel 1 pause & exit /b 1



start "" "http://localhost:5174"

call npm run dev:admin



pause

