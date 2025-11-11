# Seller Verification System - Setup Guide

## Overview
This system automatically verifies sellers through Stripe Connect and sends welcome emails when approved.

## 🔧 Required Setup Steps

### 1. Add Database Columns in Supabase

You need to add two new columns to your `users` table in Supabase:

1. **Go to your Supabase project dashboard**
2. **Navigate to**: Database → Tables → `users`
3. **Add these columns**:

| Column Name | Type | Default | Nullable | Description |
|------------|------|---------|----------|-------------|
| `stripe_account_verified` | `boolean` | `false` | No | Tracks if seller's Stripe account is verified |
| `stripe_account_verified_at` | `timestamp with time zone` | `null` | Yes | When the account was verified |

**SQL to run in Supabase SQL Editor:**

\`\`\`sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_account_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_account_verified_at TIMESTAMP WITH TIME ZONE;
\`\`\`

### 2. Configure Stripe Webhook Secret

You need to create a webhook in your Stripe Dashboard:

1. **Go to**: Stripe Dashboard → Developers → Webhooks
2. **Click**: "Add endpoint"
3. **Endpoint URL**: `https://your-domain.com/api/stripe-webhook`
4. **Events to send**:
   - `account.updated`
5. **Copy the Signing Secret** and add it as an environment variable:

\`\`\`bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
\`\`\`

### 3. Test the Webhook (Optional)

You can test the webhook using Stripe CLI:

\`\`\`bash
stripe listen --forward-to localhost:5000/api/stripe-webhook
stripe trigger account.updated
\`\`\`

## 📧 Email Configuration

The system uses Resend to send welcome emails. Make sure you have:

- `RESEND_API_KEY` configured (already set up ✅)
- Update the "from" email in `lib/email/welcome-seller.ts` if needed

Current configuration:
\`\`\`typescript
from: "YesmartUSA <no-reply@yesmartusa.com>"
\`\`\`

## 🔄 How It Works

### Flow:

1. **New Seller Signs Up**
   - User creates account on YesmartUSA
   - Stripe account verification status: `false`

2. **Seller Completes Stripe Onboarding**
   - Goes to "Mis Ganancias" (My Earnings)
   - Clicks "Configurar Cuenta de Stripe"
   - Completes Stripe Connect onboarding form

3. **Stripe Verifies Account (Automatic)**
   - Stripe reviews the information (5 min - 24 hours)
   - When approved, Stripe sends webhook to `/api/stripe-webhook`

4. **System Updates Database**
   - Webhook receives `account.updated` event
   - Checks if `charges_enabled` and `payouts_enabled` are true
   - Updates user:
     - `stripe_account_verified = true`
     - `stripe_account_verified_at = current_timestamp`

5. **Welcome Email Sent (English)**
   - System sends email to seller's email address
   - Email confirms account is ready to sell
   - Includes link to dashboard

6. **Seller Can Now Sell**
   - Dashboard unlocks full features
   - Can list products
   - Can receive payments

## 🎨 UI Changes

### Before Verification:
- Dashboard shows welcome message
- "Add Product" button hidden
- "My Orders" button hidden
- Only "Mis Ganancias" button visible
- Card with 3-step instructions displayed

### After Verification:
- Full dashboard access
- All buttons visible
- Product listing interface shown
- Can create and manage products

## 📝 Files Modified

### Backend:
- `app/api/stripe-webhook/route.ts` - New webhook endpoint
- `lib/email/welcome-seller.ts` - Email template
- `lib/types/database.ts` - Updated User interface

### Frontend:
- `app/seller/seller-dashboard-client.tsx` - Conditional UI based on verification
- `lib/i18n/LanguageContext.tsx` - New translations (EN/ES)

### Translations Added:
- `welcomeToSelling`
- `welcomeSellerSubtitle`
- `verificationRequired`
- `stepsToStart`
- `sellerStep1Title`, `sellerStep2Title`, `sellerStep3Title`
- `sellerStep1Description`, `sellerStep2Description`, `sellerStep3Description`
- `setupPaymentMethod`
- `verificationTimeTitle`
- `verificationTimeDescription`

## ⚠️ Important Notes

1. **Manual Column Addition Required**: The database columns MUST be added manually in Supabase before the system works
2. **Webhook Secret Required**: Without the webhook secret, Stripe won't be able to notify the system of verification
3. **Email Domain**: Make sure your domain is verified in Resend to send emails
4. **Production Webhook**: Remember to add the production webhook URL when deploying

## 🧪 Testing Checklist

- [ ] Database columns added in Supabase
- [ ] Stripe webhook secret configured
- [ ] New seller sees welcome message on `/seller`
- [ ] "Mis Ganancias" button visible for unverified sellers
- [ ] After Stripe onboarding, webhook receives event
- [ ] Database updates correctly
- [ ] Welcome email sent
- [ ] Dashboard unlocks after verification

## 🚀 Deployment Steps

1. Add database columns in production Supabase
2. Configure production Stripe webhook with production URL
3. Verify `RESEND_API_KEY` is set in production
4. Deploy application
5. Test with a real Stripe account

---

**Questions?** Check the webhook logs in Stripe Dashboard → Developers → Webhooks → [Your Endpoint]
