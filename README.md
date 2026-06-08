# Vurlo



**Premium ambient lighting, delivered.**



Vurlo is a full-stack eCommerce platform for a modern ambient lighting brand, offering RGB lamps, galaxy projectors, moon lamps, and aesthetic room decor.

Built with a production-ready architecture using React, TypeScript, Firebase, and deployed on Vercel.



🌐 **Live Site:** https://vurlo.store



---



## ✨ Overview



Vurlo is designed as a scalable, real-world eCommerce system with:



* Secure authentication & role-based access

* Real-time data sync with Firestore

* Admin dashboard for full store management

* Serverless backend APIs for email workflows



The project focuses on **clean architecture, performance, and production deployment**.



---



## 🚀 Features



### 🔐 Authentication & Users



* Firebase Auth (email/password)

* Password reset via serverless API + Resend

* Persistent auth state synced with Firestore

* Role-based admin access (`role` field, not email-based)



---



### 🛍️ Product & Shopping Experience



* Dynamic product pages (`/product/:slug`)

* Real-time product fetching from Firestore

* Category filtering, sorting, and search

* Quick-view modal without navigation



---



### 🛒 Cart System



* Firestore-based persistent cart for logged-in users

* LocalStorage fallback for guests

* Real-time sync using `onSnapshot`

* Cart merge on login



---



### 📦 Orders & Checkout



* Multi-step checkout flow

* COD + UPI support

* Orders stored in Firestore

* Email confirmations via Resend APIs

* Order status tracking



---



### ❤️ Wishlist



* Per-user wishlist stored in Firestore

* Real-time add/remove functionality



---



### 🔔 Notifications



* In-app notification system

* Categories: order, system, alerts

* Read/unread state with Firestore sync



---



### 🧑‍💼 Admin Panel



Protected route (`/admin`) with role-based access:



* Dashboard (revenue, orders, analytics)

* Product management (CRUD + stock)

* Order management (status updates)

* Wishlist insights

* Stock request management

* Contact form handling



---



### 📬 Contact & Email System



* Contact form → Firestore + email trigger

* Order & delivery emails via serverless functions

* File upload support via Formidable



---



### ⚡ SEO & Performance



* Dynamic meta tags per route

* JSON-LD structured data

* Auto sitemap generation

* Google Analytics integration



---



## 🛠️ Tech Stack



### Frontend



* React 19 + TypeScript

* Vite

* TanStack Router + Query

* Tailwind CSS + shadcn/ui

* Recharts



### Backend & Services



* Firebase (Auth, Firestore, Storage)

* Firebase Admin SDK

* Vercel Serverless Functions

* Resend (email service)



### DevOps



* Vercel (deployment)

* ESLint + Prettier

* Bun / npm



---



## 📂 Project Structure



```

src/

  components/

  hooks/

  lib/

  routes/

api/

scripts/

public/

```



(See full structure in repo for details)



---



## ⚙️ Local Setup



```bash

git clone https://github.com/theayushagarwal/vurlo-ecommerce.git

cd vurlo-ecommerce

npm install

npm run dev 

```



---



## 🔐 Environment Variables



### Frontend (Vite)



```env

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=

```



---



### Backend (Vercel / Serverless)



```env

FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=



RESEND_API_KEY=

RESEND_FROM_EMAIL=

```



⚠️ Never commit secrets. Use `.env.local` and Vercel dashboard.



---



## 🔒 Security



* Firebase rules enforce per-user data access

* Admin access controlled via Firestore role field

* No hardcoded API keys in source

* Environment variables properly isolated



---



## 🚀 Deployment



Deployed on **Vercel**:



1. Push to GitHub

2. Connect repo to Vercel

3. Add environment variables

4. Deploy



---



## 📸 Screenshots
<img width="2502" height="1252" alt="image" src="https://github.com/user-attachments/assets/f52accfe-3a49-4818-8420-6d6cc2f68aad" />
<img width="2496" height="1284" alt="image" src="https://github.com/user-attachments/assets/3a629471-965e-415a-833c-0c84b9558797" />
<img width="2502" height="1302" alt="image" src="https://github.com/user-attachments/assets/fdd2f446-7fb6-403d-84d8-db71c5598cf9" />


<img width="2496" height="1292" alt="image" src="https://github.com/user-attachments/assets/ee8e9eb5-ace8-48b2-9ed8-67f79ddda11e" />

<img width="2496" height="1232" alt="image" src="https://github.com/user-attachments/assets/b3f941fa-2af9-4c79-bfcc-5e289c624101" />




---



## 📈 Future Improvements



* Stripe / Razorpay integration

* Product reviews & ratings

* Advanced search & pagination

* Image optimization pipeline

* Automated email triggers

* Testing (unit + integration)



---



## 👨‍💻 Author



Built and deployed by **Ayush**



* Full-stack development

* Firebase architecture

* Debugging & production deployment
