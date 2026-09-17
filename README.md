# MOME — Modern E-Commerce Platform

A production-ready full-stack e-commerce web application built for clothing brands, featuring real-time inventory management, custom authentication, role-based access control, and an administrative dashboard.

## Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database & Auth:** Supabase (PostgreSQL), JWT Session Management
- **Testing:** Jest, Supertest

## Features

- **Storefront & Catalog:** Dynamic product filtering, real-time search, and category selection.
- **Shopping Cart & Checkout:** Persistent client-side cart, stock validation, and streamlined guest/user checkout flow.
- **Authentication:** Secure user registration, password hashing (bcrypt), and JWT-based session state.
- **Role-Based Admin Panel:** Inventory management system to add, edit, or remove products and track incoming orders.
- **Security & Performance:** Rate-limiting middleware (`express-rate-limit`), input sanitization (`express-validator`), and CORS protection.

## Setup & Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
JWT_SECRET=your-jwt-secret
ADMIN_PASSWORD=your-admin-password
PORT=5147
```

### 3. Database Migration

Execute the schema initialization script in your **Supabase SQL Editor**:

```sql
server/schema.sql
```

### 4. Run the Application

```bash
npm start
```

Visit `http://localhost:5147` in your browser.

## Project Structure

```
MOME/
├── Front/                  # Client storefront (HTML, CSS, JS)
│   ├── css/                # Custom stylesheets
│   ├── js/                 # Client modules & API integration
│   └── vault/              # Protected admin dashboard UI
├── server/                 # Express backend server
│   ├── middleware/         # Auth, validation, & rate-limiting
│   ├── routes/             # REST API endpoints (auth, products, orders, admin)
│   ├── utils/              # Helper utilities & Supabase client
│   └── schema.sql          # PostgreSQL database schema
└── tests/                  # Integration & unit tests
```

## Admin Portal

- **Route:** `/vault/admin.html`
- **Access:** Requires `ADMIN_PASSWORD` authentication.
