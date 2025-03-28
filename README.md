# Docker Node.js Task Manager

A multi-container application featuring a React frontend, Node.js backend, and MongoDB database.

## Project Structure

- Frontend: React application
- Backend: Node.js Express API
- Database: MongoDB
- Docker: Container orchestration

## Features

- Create, read, update, and delete tasks
- User authentication and authorization
- Task prioritization and status tracking
- Responsive design for desktop and mobile
- Asynchronous task processing
- Load balancing across multiple backend instances

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Running the Application

Follow these steps to run the project locally:

1. Clone the repository

```bash
git clone https://github.com/mqcuong1603/midterm-nodeJs-project.git
```

2. Navigate to the project directory

.env file is already download from github for easy testing.

3. Run the following command:

```bash
docker compose up -d
```

4. Wait for all services to initialize (this may take a few moments)

5. Access the application:

Frontend: http://localhost
API: http://localhost:3000/api
RabbitMQ Management Interface: http://localhost:15672 (username: guest, password: guest)
