@echo off

chcp 65001 >nul

cd /d "%~dp0"



echo DreamLab - 꿈연구소

echo.



if not exist "node_modules\" (

  echo npm install...

  call npm install || pause & exit /b 1

)



call node scripts\sync-branch-env.mjs

if errorlevel 1 pause & exit /b 1



if not exist "Branch\.env" (

  if exist ".env_chat" (

    echo [안내] API 키: .env_chat 사용 중 ^(우선: Branch\.env^)

  ) else (

    echo [안내] Branch\.env 에 OPENAI_API_KEY 를 넣으면 AI 해석이 동작합니다.

  )

  echo.

)



start "" "http://localhost:3000"

call npm run dev



pause

