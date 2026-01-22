# SvelteKit SaaS Starter Kit

A comprehensive, production-ready SaaS starter kit built with SvelteKit, featuring authentication, subscriptions, AI integration, and modern UI components.

## ✨ Features

### 🔐 Authentication & User Management
- **Better Auth** - Modern authentication system with Polar integration
- Google OAuth integration
- Session management with database persistence
- User profile management with image uploads
- Account linking for multiple providers

### 💳 Subscription & Billing
- **Polar.sh** integration for subscription management
- Flexible pricing tiers with real-time updates
- Real-time webhook processing for subscription events
- Customer portal for self-service billing
- Subscription status tracking (active, canceled, expired)
- Payment gating with elegant overlays

### 🤖 AI Integration
- **Vercel AI SDK** with OpenAI integration
- Streaming chat responses with real-time updates
- Multi-step conversation support
- Integrated chat widget in dashboard
- Web search preview tool

### 🎨 Modern UI/UX
- **Tailwind CSS v4** - Latest utility-first styling
- **shadcn-svelte** components - Accessible, customizable
- **Radix UI** primitives - Unstyled, accessible components
- Dark/light theme support with smooth transitions
- Responsive design with mobile-first approach
- Loading states and optimistic UI updates

### 🗄️ Database & Storage
- **Neon PostgreSQL** - Serverless database
- **Drizzle ORM** - Type-safe database toolkit
- **Cloudflare R2** - Scalable file storage with zero egress fees
- Database migrations with Drizzle Kit
- Drag & drop file uploads with progress tracking

## 🚀 Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 + shadcn-svelte
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth with Polar plugin
- **Payments**: Polar.sh
- **AI**: Vercel AI SDK + OpenAI
- **Storage**: Cloudflare R2
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
├── src/
│   ├── routes/
│   │   ├── (legal)/           # Legal pages (privacy policy, etc.)
│   │   ├── dashboard/         # Protected dashboard area
│   │   │   ├── chat/         # AI chat interface
│   │   │   ├── upload/       # File upload with R2
│   │   │   ├── payment/      # Subscription management
│   │   │   └── settings/     # User settings & billing
│   │   ├── pricing/          # Public pricing page
│   │   ├── sign-in/          # Authentication pages
│   │   ├── sign-up/          # Registration pages
│   │   ├── success/          # Post-checkout success
│   │   └── api/              # API routes
│   │       ├── auth/         # Better Auth endpoints
│   │       ├── chat/         # AI chat API
│   │       ├── upload-image/ # R2 upload API
│   │       └── payments/     # Polar webhooks
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn-svelte components
│   │   │   ├── homepage/    # Landing page sections
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── pricing/     # Pricing components
│   │   │   └── common/      # Shared components
│   │   └── server/
│   │       ├── auth.ts      # Authentication config
│   │       ├── subscription.ts # Subscription utilities
│   │       ├── upload-image.ts # R2 file upload
│   │       └── db/          # Database schema & connection
│   └── app.css              # Global styles
└── drizzle/                 # Database migrations
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket for file storage
- Polar.sh account for subscriptions
- OpenAI API key for AI features
- Google OAuth credentials (optional)
- Resend API key for email notifications

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd svelte-starter-kit
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file based on `.env.example`:
```env
# Frontend URL
PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Polar.sh Payments
POLAR_ENVIRONMENT=sandbox  # or 'production'
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_SUCCESS_URL=/success?checkout_id={CHECKOUT_ID}
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret

# Subscriptions
PUBLIC_STARTER_TIER=your-starter-tier-id
PUBLIC_STARTER_SLUG=your-starter-slug

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Resend (Email)
RESEND_API_KEY=re_123456789
RESEND_FROM_EMAIL=noreply@example.com

# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_UPLOAD_IMAGE_ACCESS_KEY_ID=your-r2-access-key-id
R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_UPLOAD_IMAGE_BUCKET_NAME=your-r2-bucket-name
```

4. **Database Setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit push

# Optional: Open Drizzle Studio to view your database
npx drizzle-kit studio
```

5. **Cloudflare R2 Setup**
- Create a Cloudflare account and set up R2 storage
- Create a bucket for file uploads
- Generate API tokens with R2 permissions
- Configure CORS settings for your domain
- Update the public URL in `src/lib/server/upload-image.ts:25`

6. **Polar.sh Setup**
- Create products for your pricing tiers
- Set up webhook endpoints for subscription events
- Configure your pricing structure
- Note: The Polar client is in **sandbox mode** by default (change in `src/lib/server/auth.ts:24` for production)

7. **Google OAuth Setup**
- Go to the [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Navigate to "APIs & Services" > "OAuth consent screen"
- Configure the consent screen (User Type: External for testing)
- Navigate to "Credentials" > "Create Credentials" > "OAuth client ID"
- Application type: "Web application"
- Authorized JavaScript origins: `http://localhost:3000` (and your production URL)
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (and your production URL)
- Copy the Client ID and Client Secret to your `.env` file

8. **Resend Setup**
- Create an account at [Resend](https://resend.com)
- Create an API Key in the dashboard
- Verify your domain (recommended for production)
- Copy the API Key to `RESEND_API_KEY` in your `.env`
- Set `RESEND_FROM_EMAIL` to your verified sender email

9. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🎯 Key Features Explained

### Subscription Management
- Automatic subscription status checking via `getSubscriptionDetails()`
- Payment gating for premium features with `isUserSubscribed()`
- Integration with Polar.sh customer portal
- Webhook handling for real-time subscription updates
- Helper functions in `src/lib/server/subscription.ts`:
  - `getSubscriptionDetails(event)` - Get user's subscription with status
  - `isUserSubscribed(event)` - Check if user has active subscription
  - `hasAccessToProduct(event, productId)` - Check access to specific product
  - `getUserSubscriptionStatus(event)` - Get status: 'active' | 'canceled' | 'expired' | 'none'

### AI Chat Integration
- Built-in chatbot with OpenAI via Vercel AI SDK
- Streaming responses using `streamText()`
- Web search preview tool integration
- Conversation context and history

### File Upload System
- **Cloudflare R2 integration** with S3-compatible API
- **Drag & drop interface** with visual feedback
- **File validation** - Type checking and size limits
- **Progress tracking** - Real-time upload progress
- **Image gallery** - View uploaded files with metadata
- **Copy URLs** - Easy sharing and integration

### Authentication Flow
- Session management via `hooks.server.ts` - sets `event.locals.session`
- Protected routes: `/dashboard/*` requires authentication
- Auth routes: `/sign-in`, `/sign-up` redirect to `/dashboard` if already authenticated
- Webhook endpoint `/api/payments/webhooks` bypasses authentication
- Session caching enabled with 5-minute TTL to reduce database queries

## 🔧 Development Commands

```bash
# Start development server (runs on http://0.0.0.0:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Type checking in watch mode
npm run check:watch

# Database migrations (Drizzle)
npx drizzle-kit generate    # Generate migrations from schema
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit push        # Push schema changes directly (dev only)
npx drizzle-kit studio      # Open Drizzle Studio GUI
```

## 🎨 Customization

### Adding New Features
1. Create components in `src/lib/components/`
2. Add API routes in `src/routes/api/`
3. Update database schema in `src/lib/server/db/schema.ts`
4. Run `npx drizzle-kit generate` and `npx drizzle-kit push`

### Styling
- Modify `src/app.css` for global styles
- Use Tailwind classes for component styling
- Customize theme colors and configuration
- shadcn-svelte components configured via `components.json`

### Authentication
- Configure providers in `src/lib/server/auth.ts`
- Add new OAuth providers as needed
- Customize user profile fields in database schema

### Path Aliases
Configured in `svelte.config.js`:
- `$components` → `src/lib/components`
- `$server` → `src/lib/server`
- `$lib` → `src/lib` (SvelteKit default)

## 📚 Learn More

- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [Svelte 5 Documentation](https://svelte.dev/docs/svelte)
- [Better Auth Documentation](https://better-auth.com)
- [Polar.sh Documentation](https://docs.polar.sh)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push
4. SvelteKit adapter-auto will automatically configure for Vercel

### Manual Deployment
```bash
npm run build
npm run preview
```

> Note: You may need to install a specific [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## ⚠️ Important Notes

### Environment Variables
- All required environment variables are listed in `.env.example`
- `POLAR_ENVIRONMENT` should be 'sandbox' for development and 'production' for live
- Use different databases for sandbox and production environments
- Update the R2 public URL in `src/lib/server/upload-image.ts:25` with your actual domain

### Database Schema
- Better Auth tables: `user`, `session`, `account`, `verification`
- Subscription table: Stores Polar subscription data synced via webhooks
- After schema changes, always run `npx drizzle-kit generate` to create migrations

### Webhook Processing
- Subscription webhooks intentionally don't throw errors on failure to avoid webhook retries
- Errors are logged but the webhook returns success
- Webhook endpoint bypasses authentication checks

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using SvelteKit and modern web technologies.
