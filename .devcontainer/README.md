# Develop with VS code devcontainers

## Prerequisites
- Docker Desktop
- VS Code Dev Containers extension

## Getting Started
### 1. Clone the repository

### 2. Configure environment variables

```bash
cp .devcontainer/.env.example .devcontainer/.env
# You can just use the default values for development.
```

### 3. Open the project in VS Code and reopen in container
- Open the project folder in VS Code
- Click the green "><" icon in the bottom-left corner
- Select "Reopen in Container"
- VS Code will build the devcontainer and start the backend and frontend services

### 4. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

### 5. Start the frontend

```bash
cd frontend
npm install # only needed the first time
npm run dev
```

## Start applications with debuggers (Optional)
- Open the "Run and Debug" sidebar in VS Code
- Start the "Debug Backend" configuration to run the Spring Boot application
- Start the "Debug Frontend" configuration to run the React application
- Set breakpoints in your code and debug as usual

## Testing
- Backend tests: `cd backend && ./mvnw test`
- Frontend tests: `cd frontend && npm test`
- You can also use the "Testing" sidebar in VS Code to run tests. 

## Extensions
### Postman
- This extension allows you to test the backend API endpoints directly from VS Code.
- Please refer to the Postman documentation for how to use it.
- You can try to send the following request to test the backend API:
    - Method: GET
    - URL: `localhost:8080/api/hello`
    - You should receive a response with a greeting message.

### SQL tools
- This extensions allows you to connect to the MySQL database running in seperate container and run queries directly from VS Code.
- To getting started: 
    1. Open the "SQL Tools" sidebar
    2. Click "Add Connection"
    3. Select "MySQL" and fill in the connection details:
        - Connection name: Your choice of name
        - Server Address: `db` (defined in `docker-compose.yml`)
        - Port: `3306`
        - Database: DB_NAME from `.env`
        - Username: DB_USER from `.env`
    4. Click "Test Connection" to verify the connection is working (Optional)
    5. Click "SAVE CONNECTION"
    6. Click "CONNECT NOW"
    7. Enter the password: DB_PASSWORD from `.env`