
# SAS Go Backend

Este es el servidor backend para la aplicación de viajes SAS Go.

## Stack Tecnológico

- **Framework:** Node.js + Express.js
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Lenguaje:** TypeScript
- **Autenticación:** JWT (Access + Refresh Tokens)
- **Validación:** Zod
- **Testing:** Jest + Supertest

## Requisitos Previos

- Node.js (v18 o superior)
- npm
- Una instancia de PostgreSQL corriendo (localmente o en la nube)

## 🚀 Puesta en Marcha

1.  **Clonar el repositorio (si aplica) y navegar a la carpeta `backend`:**
    ```bash
    cd backend
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Copia el archivo `.env.example` a un nuevo archivo llamado `.env`.
    ```bash
    cp .env.example .env
    ```
    Luego, abre `.env` y edita las variables. La más importante es `DATABASE_URL` para conectar a tu base de datos PostgreSQL.

4.  **Generar el cliente de Prisma y migrar la base de datos:**
    Este comando leerá `prisma/schema.prisma`, creará las tablas en tu base de datos y generará el cliente de Prisma para TypeScript.
    ```bash
    npm run db:migrate
    ```
    *Nota: Se te pedirá un nombre para la migración, puedes poner "initial_setup".*

## Scripts Disponibles

-   **`npm run dev`**: Inicia el servidor en modo de desarrollo con hot-reloading usando `ts-node-dev`. El servidor se reiniciará automáticamente con cada cambio en los archivos.

-   **`npm run build`**: Compila el código TypeScript a JavaScript en el directorio `dist/`.

-   **`npm run start`**: Inicia el servidor desde los archivos compilados en `dist/`. Usar para producción.

-   **`npm run test`**: Ejecuta las pruebas de integración con Jest.

-   **`npm run db:studio`**: Abre Prisma Studio, una GUI para visualizar y editar los datos de tu base de datos.
