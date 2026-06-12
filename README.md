<div align="center">
<img src="public/favicon.svg" alt="Vurlo Logo" width="64" height="64" />
Vurlo 

Premium ambient lighting, delivered.

A full-stack eCommerce platform for a modern ambient lighting brand — RGB lamps, galaxy projectors, moon lamps, and aesthetic room decor.

<img width="2536" height="1270" alt="image" src="https://github.com/user-attachments/assets/9407ef56-603f-4a0f-9108-14d1c9474cc4" />

<img width="2496" height="1298" alt="image" src="https://github.com/user-attachments/assets/dce2c4ed-1490-4174-ab69-0a6cd4e1b3f7" />

<img width="2518" height="1310" alt="image" src="https://github.com/user-attachments/assets/ab3d82bd-8bad-495f-93f9-c3e5fb63e15c" />

<img width="1210" height="630" alt="image" src="https://github.com/user-attachments/assets/0d8f5634-45aa-4208-a223-fc76ec29d219" />

</div>

Overview

Vurlo is a production-ready, scalable eCommerce system built with a modern full-stack architecture. It goes beyond a typical demo — featuring real payment processing, Firestore-enforced security rules, serverless email workflows, a full admin control panel, and live-deployed infrastructure.

Key highlights:


Secure authentication with role-based admin access
Real-time data sync via Firestore onSnapshot
Razorpay payment gateway with HMAC signature verification
Coupon & discount system with admin-controlled management
Serverless backend APIs for email, payments, and notifications
Auto-generated sitemap, JSON-LD structured data, and Google Analytics



Features

Authentication & Users


Firebase Auth with email/password sign-in
Password reset flow via serverless API + Resend email service
Persistent auth state synced with Firestore
Role-based admin access controlled via a role field on the user document (not email-based)
Saved delivery address per user profile


Product & Shopping Experience


Dynamic product pages at /product/:slug
Real-time product fetching from Firestore
Category filtering, sorting, and full-text search
Quick-view modal for browsing without leaving the current page
Product image galleries with multiple views per SKU


Cart System


Firestore-persisted cart for authenticated users
localStorage fallback for guest sessions
Real-time sync using onSnapshot listeners
Automatic cart merge on login (guest → user)


Checkout & Payments


Multi-step checkout flow (shipping → payment → confirmation)
Razorpay online payment integration with server-side order creation and HMAC-SHA256 signature verification
Cash on Delivery (COD) support
Coupon code application with percentage and fixed-amount discount types
Saved address auto-fill with option to use a new address
Orders persisted to Firestore with full item snapshots


Coupon & Discount System


Admin-created coupons stored in Firestore
Discount types: percentage (%) and fixed amount (₹)
Optional expiry date, minimum order value, and usage limit per coupon
Usage tracking with automatic deactivation on limit reached
Toggle active/inactive state per coupon from admin panel


Orders & Email Workflows


Order status tracking (pending → processing → shipped → delivered)
Automated order confirmation emails via Resend
Delivery notification emails via serverless functions
All email content is sanitized and validated server-side


Wishlist


Per-user wishlist stored in Firestore
Real-time add/remove with instant UI feedback
Admin wishlist insights panel


Notifications


In-app notification feed at /notifications
Categories: order, system, alert
Read/unread state persisted in Firestore


Admin Panel (/admin)

Protected route with Firestore role-based access:

SectionCapabilitiesDashboardRevenue overview, order counts, analytics chartsProductsFull CRUD, image management, stock controlOrdersStatus updates, order detail viewCouponsCreate, toggle, delete discount codesWishlistsPer-user wishlist insightsStock RequestsManage low-stock alertsContactsView and handle contact form submissions

SEO & Performance


Per-route dynamic <meta> tags
JSON-LD structured data for products
Auto-generated sitemap.xml at build time via scripts/generate-sitemap.js
Google Analytics event tracking
Optimized asset loading with Vite



Tech Stack

Frontend

TechnologyVersionPurposeReact19UI frameworkTypeScript5.8Type safetyVite7Build tool & dev serverTanStack RouterLatestFile-based routingTanStack Query5Server state & cachingTailwind CSS3.4Utility-first stylingshadcn/uiLatestAccessible component libraryRecharts2Analytics chartsReact Hook Form + ZodLatestForm validationSonnerLatestToast notifications

Backend & Services

TechnologyPurposeFirebase AuthUser authenticationCloud FirestoreReal-time databaseFirebase StorageProduct image hostingFirebase Admin SDKServer-side Firestore accessVercel Serverless FunctionsAPI endpointsResendTransactional email deliveryRazorpayPayment processing

DevOps & Tooling

ToolPurposeVercelHosting & serverless deploymentESLint + PrettierCode quality & formattingBun / npmPackage managementFirestore Security RulesPer-user data enforcement


Project Structure

vurlo/
├── api/                          # Vercel Serverless Functions
│   ├── create-razorpay-order.ts  # Creates Razorpay payment order
│   ├── verify-razorpay-payment.ts# Verifies HMAC signature, updates order
│   ├── forgot-password.ts        # Password reset email trigger
│   ├── send-order-email.ts       # Order confirmation email
│   ├── send-delivery-email.ts    # Delivery notification email
│   └── send-email.ts             # Contact form email handler
│
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductQuickView.tsx
│   │   ├── SearchModal.tsx
│   │   ├── AuthModal.tsx
│   │   ├── Categories.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── Testimonials.tsx
│   │   ├── WhyVurlo.tsx
│   │   ├── Newsletter.tsx
│   │   ├── Footer.tsx
│   │   └── ui/                   # shadcn/ui primitives
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.tsx          # Auth state & user profile
│   │   ├── use-cart.tsx          # Cart operations & sync
│   │   ├── use-wishlist.tsx      # Wishlist CRUD
│   │   ├── use-products.ts       # Product fetching & utilities
│   │   ├── use-notifications.tsx # In-app notification feed
│   │   └── use-premium-interactions.ts
│   │
│   ├── routes/                   # TanStack Router file-based routes
│   │   ├── index.tsx             # Homepage
│   │   ├── shop.tsx              # Product listing
│   │   ├── product.$slug.tsx     # Dynamic product page
│   │   ├── checkout.tsx          # Checkout flow
│   │   ├── order-success.tsx     # Post-purchase confirmation
│   │   ├── orders.tsx            # User order history
│   │   ├── wishlist.tsx          # User wishlist
│   │   ├── notifications.tsx     # Notification feed
│   │   ├── profile.tsx           # User profile & address
│   │   ├── search.tsx            # Search results
│   │   ├── contact.tsx           # Contact form
│   │   ├── refund-policy.tsx     # Refund policy page
│   │   ├── reset-password.tsx    # Password reset
│   │   └── admin/                # Admin panel routes
│   │       ├── dashboard.tsx
│   │       ├── products.tsx
│   │       ├── orders.tsx
│   │       ├── coupons.tsx
│   │       ├── wishlists.tsx
│   │       ├── stock-requests.tsx
│   │       ├── contacts.tsx
│   │       └── login.tsx
│   │
│   ├── lib/
│   │   ├── firebase.ts           # Firebase client init
│   │   ├── admin-auth.ts         # Admin route guard
│   │   └── analytics.ts          # GA4 event tracking
│   │
│   └── utils/
│       ├── product.ts            # Product image helpers
│       └── seo-data.ts           # Per-route meta data
│
├── scripts/
│   └── generate-sitemap.js       # Build-time sitemap generator
│
├── public/                       # Static assets & product images
├── firestore.rules               # Firestore security rules
├── firebase.json                 # Firebase project config
├── vercel.json                   # Vercel deployment config
└── vite.config.ts                # Vite build configuration


Local Setup

Prerequisites


Node.js 18+ or Bun
A Firebase project with Auth, Firestore, and Storage enabled
A Vercel account (for serverless API routes)
A Resend account (for email delivery)
A Razorpay account (for payment processing)


Installation

bash# Clone the repository
git clone https://github.com/theayushagarwal/vurlo-ecommerce.git
cd vurlo-ecommerce

# Install dependencies
npm install
# or
bun install

Running Locally

bash# Start the frontend dev server
npm run dev

# Start Vercel serverless functions (separate terminal)
npm run dev:api

# Or run both concurrently
npm run dev:all

The frontend runs at http://localhost:5173 and the API at http://localhost:3001.


Environment Variables

Create a .env.local file in the root directory for local development. Never commit this file.

Frontend (Vite)

envVITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_RAZORPAY_KEY_ID=

Backend (Vercel Serverless Functions)

Set these in your Vercel project dashboard under Settings → Environment Variables:

env# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Resend email service
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Miscellaneous
COMPLAINTS_RECEIVER_EMAIL=


Security note: The FIREBASE_PRIVATE_KEY value must include literal \n characters as stored in Vercel. The serverless functions handle .replace(/\\n/g, "\n") internally.




Security

Vurlo takes a security-first approach at every layer:

Firestore Security Rules enforce that users can only read and write their own documents. The role field on user documents is immutable by the user — only the Admin SDK can set it. Cart quantity is capped at 10 per item and product existence is verified before cart writes.

Admin access is controlled via the role: "admin" field in Firestore, not by email address or client-side logic. The admin route guard verifies this server-side.

Razorpay payments are verified using HMAC-SHA256 signature comparison on the serverless function before any order status is updated in Firestore.

Email inputs are sanitized using sanitize-html and clamped to maximum lengths before being passed to Resend or stored in Firestore.

No secrets are ever exposed to the client. All sensitive keys live in Vercel environment variables and are only accessed inside serverless functions.


Deployment

Vurlo is deployed on Vercel with zero-config serverless support for the api/ directory.


Push the repository to GitHub
Import the repo into Vercel
Add all backend environment variables in the Vercel dashboard
Vercel auto-detects Vite and deploys the frontend + serverless functions


The build command (npm run build) automatically generates a fresh sitemap.xml before the Vite production build runs.


Roadmap


 Stripe integration alongside Razorpay
 Product reviews and star ratings
 Cursor-based pagination for large product catalogs
 Image optimization pipeline (WebP conversion, CDN)
 Automated post-shipment email triggers
 Unit and integration test suite (Vitest + Playwright)
 Loyalty points / referral system



Author

Built end-to-end by Ayush Agarwal

Full-stack development · Firebase architecture · Production deployment · Payment integration


<div align="center">
Made with 💜 for ambient lighting enthusiasts everywhere · vurlo.store

</div>
