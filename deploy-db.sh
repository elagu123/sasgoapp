#!/bin/bash

# Script para desplegar la base de datos
echo "🚀 Desplegando schema de base de datos..."

# Verificar que existe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo "Configura la variable de entorno DATABASE_URL con tu connection string de PostgreSQL"
    exit 1
fi

echo "📊 Generando cliente Prisma..."
npx prisma generate

echo "🗄️ Desplegando schema a la base de datos..."
npx prisma db push

echo "✅ Base de datos configurada exitosamente!"
echo "🎯 Ahora puedes usar la aplicación con datos reales"