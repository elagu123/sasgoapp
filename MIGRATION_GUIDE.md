# 🚀 Migración a PostgreSQL (Neon) - Guía Paso a Paso

## ✅ Estado Actual
- **Base de datos actual**: SQLite (desarrollo)
- **Base de datos objetivo**: PostgreSQL en Neon (producción)
- **JWT Secrets**: ✅ Generados automáticamente

## 📝 **PASO 1: Configurar Neon Database**

### Crea tu base de datos en Neon:
1. Ve a **https://neon.com**
2. Registrate (gratis) con GitHub/Google
3. Crear proyecto nuevo:
   - **Nombre**: `sasgoapp-production`
   - **Región**: US East (recomendado)
   - **PostgreSQL**: v15
4. **COPIA** el connection string que aparece

---

## 🔧 **PASO 2: Configurar Connection String**

Una vez que tengas el connection string de Neon, necesito que lo compartas para actualizar la configuración.

Se verá así:
```
postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🗄️ **PASO 3: Migración de Schema** (Lo haré yo)

Comandos que ejecutaré una vez que tengas el connection string:

```bash
# 1. Actualizar configuración
cp backend/.env.postgresql backend/.env

# 2. Generar y aplicar migraciones
cd backend
npx prisma migrate dev --name init

# 3. Generar cliente Prisma
npx prisma generate

# 4. Verificar conexión
npx prisma db seed
```

---

## 🧪 **PASO 4: Testing** (Lo haré yo)

```bash
# Test conexión a base de datos
npm run test:db

# Test APIs con PostgreSQL
npm test backend/tests/auth.test.ts
npm test backend/tests/trip.test.ts
```

---

## ⚡ **PASO 5: Seed Data** (Opcional)

Voy a crear datos de prueba para que puedas probar todas las funcionalidades:
- Usuario de demo
- Viajes de ejemplo
- Gastos de muestra
- Lista de equipaje

---

## 📊 **Beneficios de PostgreSQL vs SQLite**

| Característica | SQLite (actual) | PostgreSQL (Neon) |
|----------------|-----------------|-------------------|
| **Concurrencia** | Limitada | Excelente |
| **Escalabilidad** | Local solo | Cloud + Autoscaling |
| **Backup** | Manual | Automático |
| **Colaboración** | No | Sí (multiple users) |
| **Productión** | No recomendado | ✅ Listo |

---

## 🚨 **Notas Importantes**

- ✅ **Datos SQLite**: Los datos actuales NO se perderán (están en `backend/dev.db`)
- ✅ **Rollback**: Puedes volver a SQLite cambiando el `.env`
- ✅ **Seguridad**: JWT secrets ya generados automáticamente
- ✅ **Testing**: La suite de tests funciona con ambas bases de datos

---

## 📞 **Próximos Pasos**

1. **TÚ**: Crear base de datos en Neon y compartir connection string
2. **YO**: Configurar migración y schema
3. **YO**: Ejecutar tests con PostgreSQL
4. **NOSOTROS**: Verificar que todo funciona
5. **YO**: Configurar Vercel con la nueva base de datos

**Tiempo estimado**: 15-20 minutos total