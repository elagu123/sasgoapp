@echo off
REM Script para desplegar la base de datos en Windows

echo 🚀 Desplegando schema de base de datos...

REM Verificar que existe DATABASE_URL
if "%DATABASE_URL%"=="" (
    echo ❌ ERROR: DATABASE_URL no está configurada
    echo Configura la variable de entorno DATABASE_URL con tu connection string de PostgreSQL
    pause
    exit /b 1
)

echo 📊 Generando cliente Prisma...
call npx prisma generate

echo 🗄️ Desplegando schema a la base de datos...
call npx prisma db push

echo ✅ Base de datos configurada exitosamente!
echo 🎯 Ahora puedes usar la aplicación con datos reales
pause