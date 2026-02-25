# ParTimer Official - Deployment Guide

## 🚀 Quick Deployment Checklist

### 1. Database Setup (CRITICAL - Do First!)

```sql
-- Execute this in Supabase SQL Editor
-- This creates all tables, functions, RLS policies, and seed data
-- File: database.sql
```

### 2. Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://bmaskqypvperqmidzcnl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNrcXlwdnBlcnFtaWR6Y25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Njg4MzYsImV4cCI6MjA4NzM0NDgzNn0.N05XvTijaW9QZ0rtoTdyXcZxJOPoD5Hwu7WEZvdI5rY
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## 🌐 Cloudflare Pages Deployment

### Step 1: GitHub Setup

1. Push code to GitHub repository
2. Ensure `.github/workflows/deploy.yml` is in place

### Step 2: Cloudflare Pages Setup

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect your GitHub repository
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Step 3: GitHub Secrets

Add these secrets to your GitHub repository:

- `CF_API_TOKEN`: Your Cloudflare API token
- `CF_ACCOUNT_ID`: Your Cloudflare account ID

## 🎯 Production Requirements

### Supabase Configuration

1. **Database**: Execute `database.sql` completely
2. **Authentication**: Enable Google OAuth
3. **Storage**: Configure buckets for assets
4. **RLS Policies**: Ensure all policies are active
5. **Functions**: Verify all database functions are deployed

### Security Checklist

- [ ] Database RLS policies active
- [ ] Authentication configured
- [ ] Environment variables secured
- [ ] CORS settings configured
- [ ] Rate limiting enabled

### Performance Optimization

- [ ] CDN enabled (Cloudflare)
- [ ] Caching headers configured
- [ ] Bundle optimization active
- [ ] Image optimization enabled

## 🧪 Testing Before Deployment

### Local Testing

```bash
# Test development server
npm run dev

# Test production build
npm run build
npm run preview

# Test database connectivity
# Visit each page and verify functionality
```

### Production Testing

1. **User Registration**: Test Google OAuth
2. **Collection System**: Verify 24-hour cycles
3. **Asset Purchasing**: Test shop functionality
4. **Admin Panel**: Verify super admin access
5. **Mobile Responsiveness**: Test on mobile devices

## 🚨 Critical Notes

### Database First!

**IMPORTANT**: Always run `database.sql` in Supabase before starting the application. The frontend will fail without the proper database schema.

### Admin Access

- **Super Admin Email**: `mdmarzangazi@gmail.com`
- **Admin Panel**: Only accessible to super admin
- **Economy Control**: Admin can adjust market parameters

### Security Features

- **Device Fingerprinting**: Prevents multi-accounting
- **Collection Security**: Device validation required
- **RLS Policies**: Row-level security active

## 📊 Performance Targets

- **Initial Load**: < 3 seconds
- **Page Transitions**: < 1 second
- **Database Queries**: < 200ms
- **Mobile Loading**: < 5 seconds

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed**

- Check Supabase URL and API key
- Verify database schema is deployed
- Check RLS policies

**Collection Not Working**

- Verify device fingerprinting
- Check user authentication
- Ensure 24-hour cycle is complete

**Admin Panel Not Accessible**

- Verify super admin email
- Check authentication status
- Ensure admin privileges are set

**Slow Loading**

- Check CDN configuration
- Verify bundle optimization
- Test database query performance

## 📈 Monitoring & Maintenance

### Database Monitoring

- Monitor query performance
- Check for failed transactions
- Monitor user growth

### Application Monitoring

- Track page load times
- Monitor error rates
- Check user engagement

### Security Monitoring

- Monitor authentication attempts
- Check for suspicious activity
- Review security logs

## 🎮 How to Play

1. **Register**: Create account with Google OAuth
2. **Explore**: Visit Dashboard to see balance and earnings
3. **Invest**: Go to Shop to purchase assets
4. **Collect**: Use Dashboard to collect earnings every 24 hours
5. **Grow**: Use referral system to earn bonuses
6. **Monitor**: Watch market dynamics affect returns

## 📞 Support

For deployment issues:

- Check this guide first
- Verify all steps completed
- Test locally before deploying
- Check browser console for errors

**Your ParTimer Official Business Simulation Platform is ready for production! 🎉**
