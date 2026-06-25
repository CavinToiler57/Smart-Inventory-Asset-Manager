# 📦 Smart Inventory Asset Manager

A full-stack inventory management system built to help companies manage IT assets such as laptops, monitors, keyboards, mice, phones, and other equipment.

It allows an admin to add assets, add employees, assign assets to employees, return assets, track assignment history, and view a complete activity log.

---

## ✨ Features

- 📦 Add, edit, and delete company assets
- 🏷️ Unique asset tag validation
- 👥 Add and delete employees
- 🔄 Assign assets to employees
- ↩️ Return assigned assets
- 📊 Dashboard statistics for total, available, assigned, and maintenance assets
- 🔍 Search assets by name, asset tag, or serial number
- 🎯 Filter assets by status
- 🟢 Asset status management:
  - Available
  - Assigned
  - Maintenance
  - Retired
- 📜 Current assignment tracking
- 🕘 Assignment history
- 🧾 Audit/activity logs for important actions
- 📧 Email notification support for asset assignments
- ⚡ Automatic data refresh after add, assign, return, edit, and delete actions
- 🗄️ PostgreSQL database integration
- 🎨 Responsive React dashboard interface

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- CSS
- Fetch API

### Backend

- Node.js
- Express.js
- PostgreSQL
- Nodemailer
- CORS

---

## 📁 Project Structure

```text
smart-inventory-asset-manager/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   ├── assets.routes.js
│   │   │   ├── employees.routes.js
│   │   │   ├── assignments.routes.js
│   │   │   └── activity.routes.js
│   │   ├── utils/
│   │   │   └── email.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
🚀 Getting Started

Follow these steps to run the project locally.

1. Clone the repository
git clone https://github.com/YOUR_USERNAME/smart-inventory-asset-manager.git

Move into the project folder:

cd smart-inventory-asset-manager
🗄️ Database Setup

Make sure PostgreSQL is installed and running on your computer.

Create a database:

CREATE DATABASE asset_manager;

Connect to the database:

psql -U postgres

Then run:

\c asset_manager

Create the required tables.

Assets Table
CREATE TABLE assets (
	id SERIAL PRIMARY KEY,
	asset_tag VARCHAR(100) UNIQUE NOT NULL,
	name VARCHAR(150) NOT NULL,
	serial_number VARCHAR(150),
	status VARCHAR(50) NOT NULL DEFAULT 'available',
	category_id INTEGER,
	purchase_date DATE,
	purchase_cost NUMERIC(12, 2),
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
Employees Table
CREATE TABLE employees (
	id SERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(150) UNIQUE,
	department VARCHAR(100),
	designation VARCHAR(100),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
Asset Assignments Table
CREATE TABLE asset_assignments (
	id SERIAL PRIMARY KEY,
	asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
	employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
	assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	returned_at TIMESTAMPTZ
);
Activity Logs Table
CREATE TABLE activity_logs (
	id SERIAL PRIMARY KEY,
	user_id INTEGER,
	action VARCHAR(150) NOT NULL,
	entity_type VARCHAR(50) NOT NULL,
	entity_id INTEGER,
	details JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
⚙️ Backend Setup

Open a terminal and go to the backend folder:

cd backend

Install dependencies:

npm install

Create a .env file inside the backend folder.

Example:

PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=asset_manager
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL@gmail.com
EMAIL_PASSWORD=YOUR_APP_PASSWORD
EMAIL_FROM=Smart Inventory <YOUR_EMAIL@gmail.com>

Start the backend server:

npm run dev

Backend will run at:

http://localhost:5000

Test the backend:

http://localhost:5000/api/health
🎨 Frontend Setup

Open a second terminal and go to the frontend folder:

cd frontend

Install dependencies:

npm install

Start the frontend:

npm run dev

Frontend will run at:

http://localhost:5173

Open this URL in your browser:

http://localhost:5173
🔗 API Endpoints
Assets
Method	Endpoint	Description
GET	/api/assets	Get all assets
POST	/api/assets	Add a new asset
GET	/api/assets/:id	Get one asset
PUT	/api/assets/:id	Update an asset
DELETE	/api/assets/:id	Delete an asset
Employees
Method	Endpoint	Description
GET	/api/employees	Get all active employees
POST	/api/employees	Add a new employee
DELETE	/api/employees/:id	Delete an employee
Assignments
Method	Endpoint	Description
GET	/api/assignments	Get current assignments
POST	/api/assignments	Assign an asset to an employee
PUT	/api/assignments/:id/return	Return an assigned asset
GET	/api/assignments/history	Get assignment history
Activity Logs
Method	Endpoint	Description
GET	/api/activity	Get recent activity logs
GET	/api/activity?limit=10	Get a limited number of activity logs
💡 How It Helps a Company

This system helps companies keep track of their equipment and avoid confusion about company assets.

For example, an IT department can easily check:

Which laptop is assigned to which employee
Which assets are currently available
Which assets are under maintenance
When an asset was assigned or returned
The full history of an asset
Who performed an important action in the system

This reduces lost equipment, improves accountability, and makes asset management easier.

🔒 Security Notes
Never upload your .env file to GitHub.
Never share database passwords publicly.
Never share email passwords or Gmail App Passwords.
Add .env to .gitignore.

Example .gitignore:

node_modules
.env
backend/.env
frontend/.env
dist
.DS_Store
🧪 Basic Testing Flow
Add a new employee
Add a new asset with a unique asset tag
Click Assign on an available asset
Select an employee
Confirm that the asset status becomes Assigned
Open Current Assignments
Click Return
Confirm that the asset status becomes Available
Check Assignment History
Check Recent Activity
🔮 Future Improvements
🔐 Login and user authentication
👑 Admin and employee roles
📷 QR code or barcode scanning
📊 Export reports to Excel or PDF
🗂️ Asset categories management
🔔 In-app notifications
📱 Mobile-friendly asset scanning
☁️ Deployment on a cloud server
🧑‍💼 Employee profile pages
📈 Advanced dashboard reports