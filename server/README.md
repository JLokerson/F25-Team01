## How to Run the Server

## 1. Set Up the Node.js backend server:
make sure node/npm is installed

```sh
cd client/server
npm install
npm install mysql2
npm install dotenv
```

### 2. Start the Node.js backend server:
```sh
cd client/server
node index.js
```
The server will run on [http://localhost:4000](http://localhost:4000).

### 2. Access the URL:
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

- **Static HTML (Backend, port 5000):**
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

Future Notes for security
bcrypt: A library for hashing passwords securely, crucial for user authentication.
jsonwebtoken (JWT): For implementing token-based authentication in web applications.

CURRENT SPRINT: SPRINT 2

## DATABASE STORED PROCEDURE INFORMATION
## Format:
# Name
- Input1: Description, Input2: Description... InputN: Description
- Effects

## AddDriver
- UserID: ID of the User account this driver is tied to, SponsorID: ID of the Sponsor organisation for the new driver
- Adds a new driver. May bug out if adding a driver for a User that already has one. Working on that. May have been fixed by the time you are reading this, though. Probably.

## GetDriverInfo
- N/A
- Retrieves all information about each driver, with duplicate drivers returned in the case of multiple sponsors for a given driver. Does not return records for Driver entries tied to deactivated user accounts.

## GetDriverInfoLimited
- N/A
- A testing utility only, this stored procedure is the same as the above but with LIMIT 1 appended to the end of the query.

## ToggleAccountActivity
- UserID: ID of the User account to have it's activity status toggled on/off.
- Updates the entry for the row matching the provided UserID in the User table, setting the ActiveAccount field to NOT ActiveAccount.


