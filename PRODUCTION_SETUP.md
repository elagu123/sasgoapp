# 🚀 SASGOAPP - Production Setup Guide

## 📋 **Checklist de API Keys y Configuración**

### 🔑 **1. Google Gemini AI API Key**
- **Obten tu clave**: https://aistudio.google.com/app/apikey
- **Pasos**:
  1. Ve a Google AI Studio
  2. Haz clic en "Create API key"
  3. Selecciona un proyecto de Google Cloud (o crea uno nuevo)
  4. Copia la API key generada
- **Variable**: `GEMINI_API_KEY` (backend) y `VITE_GEMINI_API_KEY` (frontend)

### 🗺️ **2. Google Maps API Key**
- **Obten tu clave**: https://console.cloud.google.com/apis/credentials
- **APIs a habilitar**:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API
- **Variable**: `VITE_GOOGLE_MAPS_API_KEY`

### 🌤️ **3. OpenWeather API Key**
- **Obten tu clave**: https://openweathermap.org/api
- **Plan recomendado**: One Call API 3.0
- **Variable**: `VITE_WEATHER_API_KEY` y `OPENWEATHER_API_KEY`

### 🔒 **4. JWT Secrets (Generados)**
```bash
JWT_ACCESS_SECRET="d4c7ba6edbfdf4685e79789dfc9a1e572120d3250e582b21e8cc3906507953fd"
JWT_REFRESH_SECRET="29fbe6145a3226a0f27e562135abdfc158300b78cc6ac8f99b7608e58fe62178"
```

---

## 🗄️ **Base de Datos PostgreSQL**

### **Opción 1: Railway (Recomendado)**
```bash
# 1. Crea cuenta en Railway.app
# 2. Crea nuevo proyecto PostgreSQL
# 3. Obtén la URL de conexión
DATABASE_URL="postgresql://postgres:PASSWORD@HOSTNAME:PORT/railway"
```

### **Opción 2: Supabase**
```bash
# 1. Crea cuenta en Supabase.com
# 2. Crea nuevo proyecto
# 3. Ve a Settings > Database
DATABASE_URL="postgresql://postgres.REFERENCE:PASSWORD@HOST:5432/postgres"
```

### **Opción 3: Neon**
```bash
# 1. Crea cuenta en Neon.tech
# 2. Crea nueva base de datos
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

---

## 🚀 **Deployment Options**

### **Frontend: Vercel (Recomendado)**
```bash
# 1. Conecta tu repo GitHub a Vercel
# 2. Configura las variables de entorno en Vercel Dashboard
# 3. Deploy automático en cada push
```

**Variables de entorno en Vercel:**
- `VITE_GEMINI_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY` 
- `VITE_WEATHER_API_KEY`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

### **Backend: Railway/Render**

**Railway:**
```bash
# 1. Conecta tu repo GitHub a Railway
# 2. Selecciona carpeta backend/
# 3. Configura variables de entorno
```

**Render:**
```bash
# 1. Conecta tu repo GitHub a Render
# 2. Crea nuevo Web Service
# 3. Build Command: cd backend && npm install && npx prisma generate && npm run build
# 4. Start Command: cd backend && npm start
```

---

## 🛠️ **Scripts de Build para Producción**

### **Frontend Build Script**
```json
{
  "scripts": {
    "build:prod": "vite build --mode production",
    "preview:prod": "vite preview",
    "deploy": "npm run build:prod && npm run preview:prod"
  }
}
```

### **Backend Build Script** 
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy": "npm run build && npx prisma migrate deploy"
  }
}
```

---

## 📱 **PWA Configuration**

### **Manifest Update**
```json
{
  "name": "SASGOAPP - Travel Planner",
  "short_name": "SASGOAPP",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔐 **Security Checklist**

### **HTTPS Obligatorio**
- ✅ Vercel: HTTPS automático
- ✅ Railway: HTTPS automático  
- ✅ Render: HTTPS automático

### **CORS Configuration**
```javascript
// Backend: actualizar CORS_ORIGIN
CORS_ORIGIN="https://tu-dominio.vercel.app"
```

### **Rate Limiting**
```javascript
// Configuración de producción
RATE_LIMIT_WINDOW_MS=900000  // 15 minutos
RATE_LIMIT_MAX_REQUESTS=100  // 100 requests por IP
```

---

## 📊 **Monitoring (Opcional)**

### **Sentry Error Tracking**
```bash
# 1. Crea cuenta en Sentry.io
# 2. Crea nuevo proyecto React/Node.js
# 3. Obtén DSN
VITE_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```

---

## ✅ **Pre-Deploy Checklist**

- [ ] Todas las API keys configuradas
- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas en plataforma de deploy
- [ ] CORS configurado para dominio de producción
- [ ] HTTPS habilitado
- [ ] Prisma migrations aplicadas
- [ ] Tests de build exitosos
- [ ] PWA icons creados
- [ ] Monitoring configurado (opcional)

---

## 🎯 **URLs de Ejemplo Post-Deploy**

**Frontend**: https://sasgoapp.vercel.app  
**Backend**: https://sasgoapp-backend.railway.app  
**Database**: PostgreSQL hosted

---

## 📞 **Soporte**

Si encuentras problemas durante el deploy:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de la plataforma de deploy
3. Confirma que las API keys son válidas
4. Verifica que la base de datos esté accesible