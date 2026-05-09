# Nexos Tecni-Express Warehouse App 📦

Mobile application designed for high-efficiency warehouse and inventory management. This app is a core component of the Nexos Tecni-Express ecosystem, enabling warehouse staff to perform real-time operations that synchronize across the entire platform.

## 🏗️ Architecture & Ecosystem

This application is part of a unified digital suite:
- **Warehouse App**: (This project) Mobile tool for stock control, transfers, and receiving.
- **Web Platform**: Customer-facing storefront and administrative dashboard.
- **AI Chatbot**: Intelligent assistant for parts identification and customer service.

All applications share a **single, centralized Supabase database**, ensuring that stock updates in the warehouse are immediately reflected in the online store and communicated by the chatbot.

## 🚀 Key Features

- **Real-time Inventory**: View and manage stock levels across multiple warehouses.
- **Barcode/QR Scanner**: Integrated camera scanner for rapid product identification and inventory updates.
- **Receiving (PO Processing)**: Digitalized intake of merchandise against Purchase Orders.
- **Inventory Counting**: Session-based stocktaking to maintain data integrity.
- **Warehouse Transfers**: Manage and track movement of goods between different physical locations.
- **Order Fulfillment**: Streamlined picking and packing workflow for customer orders.
- **Secure Authentication**: Integrated with Supabase Auth for role-based access.

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Language**: TypeScript
- **State & Data**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Real-time)
- **Navigation**: Expo Router (File-based routing)
- **Hardware Integration**: Expo Camera for scanning.
- **Storage**: Expo Secure Store for secure token management.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device or an Emulator (Android Studio / Xcode).
- [Git](https://git-scm.com/)

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd nexos-tecni-express-warehouse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Copy the example file and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   *Note: Ensure you use `EXPO_PUBLIC_` prefix for variables to be accessible in the Expo environment.*

4. **Start the development server**:
   ```bash
   npx expo start
   ```

5. **Run on device**:
   Scan the QR code with the **Expo Go** app or press `a` for Android / `i` for iOS to start the emulator.

## 🐳 Docker Deployment (Optional)

Following our internal standards, you can also wrap the development environment:
```bash
docker compose up --build
```

---
*Developed by Israel Salinas & Nexos Team.*
