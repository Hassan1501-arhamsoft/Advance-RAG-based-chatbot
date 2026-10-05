```diff
!Mysql command
+  sudo ss -lptn | grep 3306
+  sudo kill -9 8994



!Backend setup
+ npm init -y 
- dependencies
+ npm install express dotenv helmet cors jsonwebtoken bcrypt socket.io sequelize multer swagger-jsdoc swagger-ui-express mysql2 
- dev dependencies
+ npm install -D nodemon jest supertest

+ "scripts": {
+   "dev": "nodemon src/server.js",
+   "start": "node src/server.js",
+   "test": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand"
+  },

!frontend setup
+ npm create vite@latest frontend -- --template react-js
+ cd frontend-app
+ npm install react-router-dom axios lucide-react tailwindcss @tailwindcss/vite
+ index.css ---->  @import "tailwindcss";

!folder setup


+App-setup/
+│
+├── frontend/
+│   │
+│   ├── src/
+│   │   ├── assets/
+│   │   │
+│   │   ├── components/
+│   │   │   ├── common/
+│   │   │   └── ui/
+│   │   │
+│   │   ├── features/
+│   │   │   ├── auth/
+│   │   │   │
+│   │   │   └── profile/
+│   │   │       ├── components/
+│   │   │       ├── pages/
+│   │   │       └── services/
+│   │   │
+│   │   ├── hooks/
+│   │   ├── services/
+│   │   │  
+│   │   ├── context/
+│   │   ├── utils/
+│   │   ├── routes/
+│   │   ├── App.jsx
+│   │   └── main.jsx
+│   │
+│   ├── .env
+│   ├── .gitignore
+│   ├── package.json
+│   └── vite.config.js
+│
+│
+├── backend/
+│   │
+│   ├── src/
+│   │   ├── config/
+│   │   │   ├── db.js
+│   │   │   └── env.js
+│   │   │
+│   │   ├── middleware/
+│   │   │   ├──files
+│   │   │
+│   │   ├── models/
+│   │   │   ├──files
+│   │   │
+│   │   ├── controllers/
+│   │   │   │
+│   │   │   ├── auth/
+│   │   │   │   
+│   │   │   │
+│   │   │   ├── user/
+│   │   ├── services/
+│   │   │   │
+│   │   │   ├── auth/
+│   │   │   │   
+│   │   │   │
+│   │   │   ├── user/
+│   │   ├── utils/
+│   │   │   ├── jwt.js
+│   │   │   └── response.js
+│   │   │
+│   │   ├── app.js
+│   │   └── server.js
+│   │
+│   ├── .env
+│   ├── .gitignore
+│   └── package.json
+│
+├── README.md
+└── .gitignore
```