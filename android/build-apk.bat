@rem ==============================================================
@rem  CIEIB Android APK Build Script
@rem  Baixa Gradle wrapper automaticamente e compila o APK
@rem ==============================================================
@echo off
setlocal

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo ============================================
echo   CIEIB - Build APK Android
echo ============================================
echo.

:: Verificar Java
java -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Java nao encontrado. Instale o JDK 17+
    exit /b 1
)
echo [OK] Java encontrado

:: Verificar Android SDK
if not exist "%ANDROID_HOME%\platforms" (
    echo [ERRO] Android SDK nao encontrado em %ANDROID_HOME%
    exit /b 1
)
echo [OK] Android SDK encontrado

:: Ir para o diretorio android
cd /d "%~dp0"

:: Baixar Gradle Wrapper se nao existir
if not exist "gradlew.bat" (
    echo.
    echo [INFO] Baixando Gradle Wrapper...
    
    :: Criar diretorio
    if not exist "gradle\wrapper" mkdir "gradle\wrapper"
    
    :: Baixar wrapper JAR via PowerShell
    powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/niccokunzmann/gradle-wrapper/main/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar' }" 2>nul
    
    if not exist "gradle\wrapper\gradle-wrapper.jar" (
        echo [INFO] Tentando metodo alternativo...
        powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $url='https://github.com/niccokunzmann/gradle-wrapper/raw/main/gradle/wrapper/gradle-wrapper.jar'; (New-Object Net.WebClient).DownloadFile($url, 'gradle\wrapper\gradle-wrapper.jar') }" 2>nul
    )
    
    :: Criar gradlew.bat
    (
        echo @rem
        echo @rem  Gradle startup script for Windows
        echo @rem
        echo @echo off
        echo setlocal
        echo set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        echo set "DEFAULT_JVM_OPTS=-Xmx2048m -Dfile.encoding=UTF-8"
        echo set "CLASSPATH=%%~dp0gradle\wrapper\gradle-wrapper.jar"
        echo "%%JAVA_HOME%%\bin\java.exe" %%DEFAULT_JVM_OPTS%% -classpath "%%CLASSPATH%%" org.gradle.wrapper.GradleWrapperMain %%*
    ) > gradlew.bat
    
    echo [OK] Gradle Wrapper configurado
)

echo.
echo [BUILD] Compilando APK release...
echo.

:: Build APK
call gradlew.bat assembleRelease --no-daemon

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Build falhou! Verifique os erros acima.
    exit /b 1
)

echo.
echo ============================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ============================================

:: Copiar APK para pasta raiz
set "APK_PATH=app\build\outputs\apk\release\app-release.apk"
if exist "%APK_PATH%" (
    copy /y "%APK_PATH%" "..\CIEIB.apk" >nul
    echo.
    echo   APK gerado: CIEIB.apk
    echo   Tamanho:
    for %%F in ("..\CIEIB.apk") do echo   %%~zF bytes
    echo.
    echo   Localizacao: %~dp0..\CIEIB.apk
) else (
    set "APK_UNSIGNED=app\build\outputs\apk\release\app-release-unsigned.apk"
    if exist "!APK_UNSIGNED!" (
        copy /y "!APK_UNSIGNED!" "..\CIEIB-unsigned.apk" >nul
        echo   APK nao-assinado gerado: CIEIB-unsigned.apk
    )
)

echo.
endlocal
