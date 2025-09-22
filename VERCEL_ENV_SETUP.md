# 🚀 Variables de Entorno para Vercel

## 📋 LISTA COMPLETA DE VARIABLES REQUERIDAS

### 🗄️ **Database (CRÍTICAS - YA TENEMOS)**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_IXFHyTp2g4tu@ep-nameless-forest-ac05hqxd-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 🔐 **JWT Secrets (CRÍTICAS - YA GENERADAS)**
```bash
JWT_ACCESS_SECRET=c5742047a64e0cb886f2efba8fef8630305c836202af1508d305022f24245f58
JWT_REFRESH_SECRET=6f661bdc01ff7bed078fbe85881cd1eff25cad3b91c26a4d71d60a90b2a48a23
```

### 🌐 **App Configuration (CRÍTICAS)**
```bash
NODE_ENV=production
CORS_ORIGIN=https://YOURAPP.vercel.app
```

### 🤖 **API Keys (OPCIONALES - Para funcionalidad completa)**
```bash
# Gemini AI (para trip planning)
VITE_GEMINI_API_KEY=TU_API_KEY_AQUI
GEMINI_API_KEY=TU_API_KEY_AQUI

# Google Maps (para mapas)
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI

# Weather API (para clima)
VITE_WEATHER_API_KEY=TU_API_KEY_AQUI
OPENWEATHER_API_KEY=TU_API_KEY_AQUI
```

### 📱 **Frontend URLs (SE CONFIGURAN DESPUÉS DEL DEPLOY)**
```bash
VITE_API_BASE_URL=https://YOURAPP.vercel.app/api
VITE_WS_URL=wss://YOURAPP.vercel.app
```

---

## 🎯 **ESTRATEGIA DE DEPLOYMENT**

### Paso 1: Deploy Básico (Solo variables críticas)
- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- NODE_ENV=production

### Paso 2: Configurar URLs después del deploy
- CORS_ORIGIN (con la URL real de Vercel)
- VITE_API_BASE_URL
- VITE_WS_URL

### Paso 3: APIs opcionales (más tarde)
- Gemini, Google Maps, Weather APIs

---

## 📝 **INSTRUCCIONES PASO A PASO**

### 1. En Vercel Dashboard:
- Ve a tu proyecto
- Settings → Environment Variables
- Add cada variable una por una

### 2. Deployment:
```bash
npx vercel --prod
```

### 3. Update URLs:
- Copiar la URL de Vercel
- Actualizar CORS_ORIGIN y VITE_* variables
- Redeploy

---

## ⚡ **Resultado Final:**
- ✅ App funcionando en producción
- ✅ Base de datos PostgreSQL conectada
- ✅ Authentication funcionando
- ✅ APIs respondiendo
- ✅ PWA lista para instalar