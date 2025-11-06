# Introduction 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 

# Technologies 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 
Node.js
React
SQL
AWS

# Getting Started
TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:
1.	Software dependencies
2.	Latest releases
3.	API references

## Installation Process

After cloning the repository, you need to install dependencies for both the frontend (React) and backend (Node.js/Express):

1. **Install frontend dependencies:**
   ```sh
   cd client
   npm install
   npm install react-cookies
   ```

2. **Install backend dependencies:**
   ```sh
   cd server
   npm install
   ```

This will install all required packages listed in each folder’s `package.json`.

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)

## How to Run the Server and Access About/Login Pages

### 1. Start the Node.js backend server:
```sh
cd client/server
node index.js
```
The server will run on [http://localhost:5000](http://localhost:5000).

### 2. Access the About and Login pages (Static HTML):
- Open your browser and go to [http://localhost:5000/](http://localhost:5000/) to view the About page.
- To view the Login page, go to [http://localhost:5000/login.html](http://localhost:5000/login.html).

---

## How to Run the React Frontend

1. **Start the React development server:**
   ```sh
   cd client
   npm start
   ```
   The React app will run on [http://localhost:3000](http://localhost:3000/).

2. **Access About and Login pages (React):**
   - Navigate to [http://localhost:3000/about](http://localhost:3000/about) for the About page.
   - Navigate to [http://localhost:3000/login](http://localhost:3000/login) for the Login page.

---

### Differences Between Static HTML and React Frontend

- **Static HTML (Backend, port 4000):**
  - Pages are served as plain HTML files from the backend.
  - Limited interactivity and dynamic content.
  - Good for simple, static pages.

- **React Frontend (port 3000):**
  - Pages are built as React components using JSX.
  - Supports dynamic, interactive user interfaces.
  - Easier to manage state and complex UI logic.
  - Recommended for modern web applications.

> **Notes:**  
> I found React prefers using JSX files for components instead of plain HTML. JSX allows you to write HTML-like syntax directly in JavaScript, making it easier to create dynamic and interactive user interfaces. It's not something we discussed in planning, but we might what to consider the switch over HTML. Plan discuss as a group. 

TODO: Find Template for About Page/Login stuff. 
Make sure that the database cooperates with this setup.  

CURRENT SPRINT: SPRINT 9

