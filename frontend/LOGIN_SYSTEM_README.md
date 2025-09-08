# Separate Login System for Admin and SuperAdmin

This document describes the implementation of separate login functionality for admin and superadmin users in the frontend.

## Overview

The system now provides three different login entry points:

1. **Login Selection Page** (`/login-selection`) - Main entry point where users choose their role
2. **Admin Login** (`/admin-login`) - Dedicated login for administrators
3. **Super Admin Login** (`/superadmin-login`) - Dedicated login for super administrators

## Components Created

### 1. Login Selection Component
- **File**: `src/app/login-selection/login-selection.ts`
- **Template**: `src/app/login-selection/login-selection.html`
- **Purpose**: Allows users to choose between admin and superadmin login
- **Route**: `/login-selection`

### 2. Admin Login Component
- **File**: `src/app/admin-login/admin-login.ts`
- **Template**: `src/app/admin-login/admin-login.html`
- **Purpose**: Dedicated login form for administrators
- **Route**: `/admin-login`
- **Features**:
  - Role-specific error messages
  - Back button to login selection
  - Loading states
  - Stores admin data in localStorage

### 3. Super Admin Login Component
- **File**: `src/app/superadmin-login/superadmin-login.ts`
- **Template**: `src/app/superadmin-login/superadmin-login.html`
- **Purpose**: Dedicated login form for super administrators
- **Route**: `/superadmin-login`
- **Features**:
  - Role-specific error messages
  - Back button to login selection
  - Loading states
  - Stores superadmin data in localStorage

## Updated Components

### 1. Auth Service (`src/app/services/auth.service.ts`)
Added new methods:
- `getUserRole()` - Get current user role
- `isAdmin()` - Check if user is admin
- `isSuperAdmin()` - Check if user is superadmin
- `getCurrentAdmin()` - Get current admin data
- `getCurrentSuperAdmin()` - Get current superadmin data

### 2. Auth Guard (`src/app/services/auth.guard.ts`)
Enhanced to:
- Check user roles
- Redirect to appropriate login based on role
- Support role-based route protection

### 3. Navbar (`src/app/navbar/navbar.ts`)
Updated to:
- Display role-specific user information
- Show different avatars for admin vs superadmin
- Redirect to login selection on logout

### 4. Sidebar (`src/app/sidebar/sidebar.ts`)
Enhanced to:
- Show role-based navigation items
- Display "User Management" only for superadmins
- Use different styling for superadmin-specific features

### 5. App Routes (`src/app/app.routes.ts`)
Added new routes:
- `/login-selection` - Login selection page
- `/admin-login` - Admin login page
- `/superadmin-login` - Super admin login page

## Role-Based Features

### Admin Features
- Access to all standard dashboard features
- Cannot access user management
- Blue-themed UI elements

### Super Admin Features
- Access to all admin features
- Additional access to user management
- Purple-themed UI elements for superadmin-specific features

## Usage

1. **First Time Access**: Users are redirected to `/login-selection`
2. **Role Selection**: Users choose between "Admin Login" or "Super Admin Login"
3. **Authentication**: Users are redirected to the appropriate login form
4. **Dashboard Access**: After successful login, users are redirected to `/dashboard`
5. **Role-Based Navigation**: The sidebar and navbar adapt based on the user's role

## Backward Compatibility

The original login route (`/login`) is still available for backward compatibility, but new users should use the login selection page.

## Security

- Role information is stored in localStorage
- Auth guard validates roles before allowing access to protected routes
- Each login form validates against the appropriate backend endpoint
- Logout clears all role-specific data

## Styling

- Admin login uses blue color scheme
- Super admin login uses purple color scheme
- Login selection uses a gradient background
- Role-specific avatars and UI elements
