# 🚀 SASGOAPP

## 📋 Descripción del Proyecto
SASGOAPP es una aplicación web fullstack de planificación de viajes inteligente que combina IA con colaboración en tiempo real. Permite a los usuarios crear, organizar y compartir itinerarios de viaje, gestionar listas de equipaje, seguimiento de gastos y reservas, todo potenciado por inteligencia artificial para recomendaciones personalizadas.

## 🛠️ Stack Tecnológico
- **Frontend:** React 19.1.1 + TypeScript + Vite
- **Estilos:** Tailwind CSS v3.4.4
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL con Prisma ORM v5.17.0
- **APIs:** Google Gemini AI para recomendaciones inteligentes
- **Real-time:** WebSocket con Yjs para colaboración en tiempo real
- **Auth:** JWT con refresh tokens + bcrypt
- **Testing:** Vitest + Playwright E2E
- **Form Management:** React Hook Form + Zod validation
- **UI/UX:** Framer Motion + drag-and-drop (@dnd-kit)

## 📂 Estructura del Proyecto
```
sasgoapp/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizables
│   ├── contexts/                # Context providers (Auth, Theme, etc)
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Páginas de la aplicación
│   ├── services/                # API calls y servicios externos
│   ├── state/                   # Gestión de estado global
│   ├── lib/                     # Utilidades y helpers
│   ├── styles/                  # Estilos y themes
│   ├── App.tsx                  # Componente principal
│   ├── index.tsx                # Entry point
│   ├── types.ts                 # Definiciones TypeScript
│   └── constants.ts             # Constantes de la app
├── backend/                     # Backend Node.js
│   ├── src/
│   │   ├── controllers/         # Controladores HTTP
│   │   ├── services/            # Lógica de negocio
│   │   ├── middleware/          # Middlewares (auth, CSRF, etc)
│   │   ├── routes/              # Definición de rutas
│   │   ├── utils/               # Utilidades (JWT, validaciones)
│   │   ├── validators/          # Schemas de validación Zod
│   │   ├── lib/                 # Prisma client y configs
│   │   └── index.ts             # Servidor principal
│   ├── prisma/                  # Schema y migraciones DB
│   ├── tests/                   # Tests unitarios
│   └── .env.example             # Variables de entorno backend
├── tests/                       # Tests E2E Playwright
├── public/                      # Assets estáticos
├── .env.example                 # Variables de entorno frontend
├── .gitignore                   # Archivos ignorados por Git
└── README.md                    # Documentación principal
```

## ⚙️ Instalación

### Requisitos Previos
- Node.js v18+ 
- npm o yarn
- PostgreSQL 14+

### Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/elagu123/sasgoapp.git
cd sasgoapp

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd backend
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves reales

# 5. Configurar base de datos
npm run db:generate
npm run db:migrate

# 6. Ejecutar en desarrollo
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 🔑 Variables de Entorno Necesarias

### Frontend (.env)
- `GEMINI_API_KEY` - API key de Google Gemini AI

### Backend (backend/.env)
- `DATABASE_URL` - Conexión a PostgreSQL
- `JWT_ACCESS_SECRET` - Secreto para tokens de acceso (min 32 chars)
- `JWT_REFRESH_SECRET` - Secreto para refresh tokens (min 32 chars) 
- `NODE_ENV` - Entorno de ejecución (development/production)
- `PORT` - Puerto del servidor (default: 3001)
- `CORS_ORIGIN` - URL permitida para CORS (default: http://localhost:5173)

## 📊 Estado Actual - 09 Septiembre 2025

### ✅ Completado
- **Arquitectura Fullstack** - Frontend React + Backend Express configurados
- **Autenticación Segura** - JWT con refresh tokens, CSRF protection
- **Base de Datos** - Prisma ORM con modelos completos (Users, Trips, Expenses, etc)
- **Real-time Collaboration** - WebSocket con Yjs para edición colaborativa
- **UI/UX Avanzada** - Componentes con drag-and-drop, animaciones
- **Gestión de Estado** - Contexts para auth, theme, trips
- **Validación Robusta** - Zod schemas para frontend y backend
- **Testing Setup** - Vitest unitarios + Playwright E2E
- **Seguridad** - Rate limiting, helmet, input sanitization
- **AI Integration** - Google Gemini para recomendaciones de viaje

### 🔄 En Progreso
- **Funcionalidades Core** - Creación/edición de viajes e itinerarios
- **Gestión de Equipaje** - Listas de packing inteligentes
- **Expenses Tracking** - Seguimiento de gastos por viaje
- **Colaboración** - Compartir viajes con otros usuarios

### 📝 TODO - Próximas Tareas
- [ ] Implementar onboarding de usuarios nuevos
- [ ] Optimizar performance con lazy loading
- [ ] Agregar PWA capabilities
- [ ] Implementar notificaciones push
- [ ] Dashboard de analytics para usuarios
- [ ] Integración con APIs de mapas (Google Maps/Mapbox)
- [ ] Sistema de templates de viajes
- [ ] Export/import de itinerarios (PDF, JSON)
- [ ] Mobile responsive optimization
- [ ] Caching con Redis para mejor performance

### 🚨 Problemas Conocidos / Críticos
- **Dependencia y-indexeddb** - Versión no encontrada, revisar compatibilidad
- **WebSocket Auth** - Necesita testing exhaustivo en producción
- **Database Migrations** - Faltan migraciones iniciales para setup limpio
- **Error Handling** - Mejorar manejo de errores de red en frontend

## 💡 Decisiones Técnicas

### Arquitectura
- **Monorepo structure** para frontend y backend juntos
- **TypeScript full-stack** para type safety end-to-end
- **Prisma ORM** por facilidad de migrations y type generation
- **Zod validation** compartida entre frontend y backend

### Patrones
- **Repository Pattern** en servicios del backend
- **Custom Hooks** para lógica reutilizable en React
- **Context + Reducers** para estado global complejo
- **API-first approach** con OpenAPI-ready structure

## 🔐 Seguridad

### ✅ Implementado
- Variables sensibles en .env (no versionadas)
- .gitignore configurado profesionalmente  
- JWT access/refresh token pattern
- CSRF protection con double-submit cookies
- Rate limiting por IP
- Input validation con Zod
- SQL injection protection via Prisma
- Helmet.js security headers
- bcrypt para hash de passwords

### ⚠️ Revisar en Producción
- Implementar HTTPS y security headers adicionales
- Configurar CORS restrictivo para producción
- Habilitar logging y monitoring
- Setup de backup automático de DB
- Implementar key rotation para JWT secrets

## 📝 Notas para Futuras Sesiones de Desarrollo

### Contexto del Proyecto
SASGOAPP es una aplicación de planificación de viajes que permite a los usuarios crear itinerarios colaborativos, gestionar listas de equipaje inteligentes, hacer seguimiento de gastos y obtener recomendaciones personalizadas mediante IA. La arquitectura fullstack permite real-time collaboration entre usuarios compartiendo el mismo viaje.

### Archivos Principales
- `src/App.tsx` - Router principal y layout de la aplicación
- `src/contexts/AuthContext.tsx` - Gestión de autenticación y estado usuario
- `src/services/api.ts` - Cliente API centralizado con interceptores
- `backend/src/index.ts` - Servidor Express con WebSocket y middlewares
- `backend/src/utils/jwt.ts` - Gestión de tokens JWT
- `backend/prisma/schema.prisma` - Esquema de base de datos

### Comandos del Proyecto
```bash
# Frontend
npm run dev          # Desarrollo con hot reload
npm run build        # Build para producción  
npm run preview      # Preview del build
npm run test         # Tests unitarios con Vitest
npm run test:e2e     # Tests E2E con Playwright

# Backend
npm run dev          # Desarrollo con auto-restart
npm run build        # Compilar TypeScript
npm run start        # Ejecutar build de producción
npm run test         # Tests unitarios con Jest
npm run db:migrate   # Ejecutar migraciones de DB
npm run db:generate  # Generar Prisma client
npm run db:studio    # Interfaz visual de DB
```

### Historial de Desarrollo
**09 Septiembre 2025** - Configuración Inicial Profesional
- Inicializado repositorio Git con credenciales de Agustin
- Configurado .gitignore profesional y .env.example completo
- Creada documentación base y estructura de proyecto
- Análisis completo de stack tecnológico y arquitectura
- Configuradas medidas de seguridad y validaciones
- Preparado para desarrollo colaborativo y CI/CD

---

📅 **Última actualización:** 09 Septiembre 2025, 19:30 ART  
👤 **Desarrollador:** Agustin (agsasmoda@gmail.com)  
🔗 **Repositorio:** https://github.com/elagu123/sasgoapp

---

### 🚀 ¿Listo para contribuir?
1. Fork del repositorio
2. Crear rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit con mensaje descriptivo: `git commit -m "feat: agregar nueva funcionalidad"`
4. Push a tu rama: `git push origin feature/nueva-funcionalidad` 
5. Abrir Pull Request

**¡Bienvenido al desarrollo de SASGOAPP!** 🎉