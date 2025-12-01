# Trucker Rewards Platform

## Introduction

This project is a **Trucker Rewards Website** designed to incentivize commercial truck drivers. The platform allows sponsoring companies to **issue points** to their drivers, which the drivers can then **redeem for various rewards**.

## Group Members

Ohm Patel
Julia Lokerson
Emerson Khan
Jason Lin

### Objectives

The primary objectives of this project are:

1.  Provide a secure, scalable platform for companies to manage and issue rewards points.
2.  Offer drivers an intuitive, user-friendly interface to track their points and browse/redeem rewards.
3.  Establish a robust, full-stack application leveraging modern web technologies and cloud infrastructure.

-----

## Technologies

This application is built as a **full-stack solution** utilizing a robust set of modern technologies for both development and deployment.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Node.js (Express)** | Runtime environment for the server-side logic and API development. |
| **Frontend** | **React** | JavaScript library used for building the dynamic, single-page user interface (SPA). |
| **Database** | **SQL (MySQL/PostgreSQL)** | Relational database management system for persistent storage of user, points, and rewards data. |
| **Cloud Hosting** | **AWS Lambda** | Serverless compute service hosting the backend API. |
| **Cloud Hosting** | **AWS EC2** | Virtual server instance hosting the production static build of the React frontend via Nginx. |
| **Deployment** | **GitHub Actions** | CI/CD pipeline for automated testing and deployment to AWS. |

-----

## Getting Started

This section guides users through setting up the project for local development or understanding the AWS deployment structure.

### Software Dependencies

To run the project locally, you must have the following software installed:

1.  **Node.js (LTS version)**: Includes npm (Node Package Manager).
2.  **`make` Utility**: For easy execution of build/run commands (standard on Linux/macOS, available via tools like Chocolatey or WSL on Windows).

### Database Setup

Before running the server, you must have a compatible **SQL database** instance running and configured.

  * Reference the file **`DBCreationCommand.txt`** in the repository root for the necessary SQL commands to create the required tables and schema.
  * The database structure can be visualized in the **`GroupDB.png`** diagram.

### Installation Process (Local)

The following steps use the provided **`Makefile`** to streamline setup.

1.  **Clone the repository:**

    ```sh
    git clone [repo_url]
    ```

2.  **Install all dependencies:**
    This command runs `npm install` in both the `client` and `server` directories.

    ```sh
    make install
    ```

3.  **Configure Environment Variables:**
    The server requires a `.env` file for configuration. Create a file named **`.env`** inside the **`server`** directory with the following structure, replacing the placeholders with your local database credentials:

    ```ini
    # .env
    SERVER_PORT=4000
    DB_HOST=localhost 
    DB_USER=your_db_username
    DB_PASS=your_db_password
    DB_NAME=your_db_name
    ```

### Local Development Usage

Once dependencies are installed and the `.env` file is configured, you can run the application:

  * **Simultaneous Development Run:**
    This command starts both the Node.js backend server (on port **4000**) and the React development server (on port **3000**) concurrently.

    ```sh
    make dev
    ```

      * **Frontend Access:** Access the React application in your browser at **`http://localhost:3000/`**.

  * **Specific Commands:** For more specific operations, refer to the **`Makefile`**:

      * `make client`: Runs only the React frontend (`cd client && npm start`).
      * `make server`: Runs only the Node.js backend (`cd server && node index.js`).

-----

## AWS Deployment Implementation

The production environment is hosted on Amazon Web Services (AWS) using a serverless architecture for the backend and a dedicated instance for the frontend.

### Backend Deployment (AWS Lambda)

  * The server code is bundled (including the **`lambda.js`** wrapper file) and deployed to **AWS Lambda** as a ZIP archive.
  * The **`lambda.js`** file acts as the bridge, connecting our standard Express server code to the AWS Lambda execution environment.
  * Deployment is automated using **GitHub Actions**, triggered on pushes to the main branch. The workflow is defined in **`.github/workflows/main.yaml`**, which securely utilizes GitHub Secrets for AWS credentials.
  * The live API endpoint is accessible via the **AWS Lambda Function URL**.

### Frontend Deployment (AWS EC2 & Nginx)

  * The production build of the React client is hosted on an **AWS EC2** instance running an **Ubuntu server**.
  * **Nginx** is used to serve the static client files over HTTP/HTTPS, acting as a high-performance web server.
  * An automatic update script, **`autoSiteUpdater.sh`**, runs via a **cron job** on the EC2 instance to periodically pull the latest static build from the repository and update the site served by Nginx. Refer to the script file for detailed logic.

> **Reference:** This deployment approach was informed by external guidelines on deploying React apps to AWS EC2: [https://medium.com/@rizkiprass/step-by-step-guide-deploying-a-react-app-on-aws-ec2-b2965af05aa4](https://medium.com/@rizkiprass/step-by-step-guide-deploying-a-react-app-on-aws-ec2-b2965af05aa4)

-----

## Build and Test

### Building the Project

The React application must be built into static files for production deployment. This is done automatically by the CI/CD pipeline, but can be performed manually:

```sh
cd client
npm run build
```

This command compiles the React JSX code and assets into a production-ready **`build`** folder within the `client` directory.

-----

## Project Status

**Current Development Sprint:** **Sprint 11**

