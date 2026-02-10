# Hosting Guide for Shaadi Application

## 1. Prerequisites
- **GitHub Account** (Free)
- **MongoDB Atlas Account** (Free)
- **Render Account** (Free)
- **Vercel Account** (Free)

## 2. Set up MongoDB Atlas (Database)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **New Project**.
3.  Click **Build a Database** -> select **M0 (Free)** -> **Create**.
4.  **Security Quickstart**:
    - Create a database user (username/password). **Remember these!**
    - Add IP Address: `0.0.0.0/0` (Allow access from anywhere, so Render can connect).
5.  Click **Connect** -> **Drivers** -> **Python** -> **3.12 or later**.
6.  Copy the connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`).
7.  Replace `<password>` with your actual password. **Keep this secret!**

## 3. Deploy Backend (Render)
1.  Push your code to **GitHub**.
2.  Log in to [Render](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    - **Name**: `shaadi-backend` (or similar)
    - **Region**: Closest to you (e.g., Singapore/Frankfurt/Ohio)
    - **Branch**: `main`
    - **Root Directory**: `backend` (Important!)
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6.  **Environment Variables** (Scroll down):
    - Key: `PYTHON_VERSION` Value: `3.9.0` (or similar stable version)
    - Key: `MONGO_URI` Value: (Paste your valid MongoDB connection string from step 2)
7.  Click **Create Web Service**.
8.  Wait for deployment. Once live, copy the URL (e.g., `https://shaadi-backend.onrender.com`).

## 4. Deploy Frontend (Vercel)
1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    - **Framework Preset**: Vite
    - **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    - Key: `VITE_API_URL`
    - Value: (Paste your backend URL from Render **without trailing slash**, e.g., `https://shaadi-backend.onrender.com`)
6.  Click **Deploy**.

## 5. Final Check
- Open your Vercel app URL.
- Try adding a room or occupant.
- If it works, check MongoDB Atlas to see the data appear in your collection!

## Troubleshooting
- **Backend logs**: Check "Logs" tab in Render if deployment fails.
- **Frontend 404/Network Error**: Check browser console (F12) and ensure `VITE_API_URL` is correct and starts with `https://`.
