# Tenant Identification Fix - Testing Guide

## Problem Fixed
Products, categories, sections, and logos were not showing on custom domains or subdomains because the backend couldn't properly identify which store's data to load.

## Changes Made

### 1. Enhanced Subdomain Handler (`server/index.js`)
- **Improved Priority Order**: Now checks `x-subdomain` header first, then custom domain, then subdomain
- **Better Custom Domain Matching**: Handles both `www` and non-`www` versions automatically
- **Comprehensive Logging**: Added detailed console logs to track tenant identification

### 2. How It Works Now

#### For Subdomains (e.g., `mystore.localhost:3000`)
1. Frontend detects subdomain via `getTenantId()` → returns `"mystore"`
2. Frontend sends `x-subdomain: mystore` header with API requests
3. Backend searches database: `{ subdomain: "mystore" }`
4. Sets `req.tenantClient` for that store
5. Products/categories filtered by `clientId`

#### For Custom Domains (e.g., `www.mystore.com`)
1. Frontend detects custom domain via `getTenantId()` → returns `"www.mystore.com"`
2. Frontend sends `x-subdomain: www.mystore.com` header
3. Backend searches database with `$or` query:
   - `{ customDomain: "www.mystore.com" }`
   - `{ customDomain: "mystore.com" }` (without www)
   - `{ customDomain: "www.www.mystore.com" }` (with www added)
4. Sets `req.tenantClient` for that store
5. Products/categories filtered by `clientId`

## Testing Steps

### Test 1: Subdomain on Localhost
1. Open `http://mystore.localhost:3000` (replace `mystore` with your actual subdomain)
2. Check browser console - should see API requests with `x-subdomain` header
3. Check server terminal - should see:
   ```
   [Tenant] Processing request: GET /api/products
   [Tenant] Host: mystore.localhost, x-subdomain header: mystore
   [Tenant] Searching by subdomain: mystore
   [Tenant] ✅ Found tenant via x-subdomain header: Store Name (ID: ...)
   ```
4. Products and categories should load correctly

### Test 2: Custom Domain
1. Configure a custom domain in your store settings
2. Update your hosts file or DNS to point to localhost/your server
3. Open the custom domain in browser
4. Check server terminal - should see:
   ```
   [Tenant] Processing request: GET /api/products
   [Tenant] Host: www.yourstore.com, x-subdomain header: www.yourstore.com
   [Tenant] Searching by customDomain: www.yourstore.com
   [Tenant] ✅ Found tenant via custom domain: Store Name (ID: ...)
   ```
5. Products and categories should load correctly

### Test 3: Dashboard (app subdomain)
1. Open `http://app.localhost:3000/dashboard`
2. Should work normally with authentication
3. Server logs should show:
   ```
   [Tenant] Skipping reserved subdomain: app
   ```

## Debugging

### If products still don't show:

1. **Check Server Logs**
   - Look for `[Tenant]` prefixed messages
   - Verify tenant is being found: `✅ Found tenant via...`
   - If you see `❌ No tenant identified`, the issue is in tenant detection

2. **Check Database**
   ```javascript
   // In MongoDB, verify your store has correct subdomain/customDomain
   db.clients.find({ subdomain: "mystore" })
   db.clients.find({ customDomain: "www.mystore.com" })
   ```

3. **Check Frontend Headers**
   - Open browser DevTools → Network tab
   - Click on any API request (e.g., `/api/products`)
   - Check Request Headers → should see `x-subdomain: yourstore` or `x-subdomain: www.yourstore.com`

4. **Check Products in Database**
   ```javascript
   // Verify products exist for your clientId
   db.products.find({ clientId: ObjectId("your_client_id") })
   ```

## Common Issues

### Issue: "No tenant found for x-subdomain"
**Solution**: Check that your store's `subdomain` or `customDomain` field matches exactly what's being sent in the header

### Issue: Products exist but don't show
**Solution**: Verify products have the correct `clientId` matching your store's `_id`

### Issue: Works on subdomain but not custom domain
**Solution**: Ensure custom domain is saved in store settings and matches the domain you're accessing (with or without www)

## Next Steps

After verifying the fix works:
1. Test on production environment
2. Monitor server logs for any tenant identification failures
3. Consider adding a fallback UI message when no products are found

---

**Note**: The server automatically restarts with nodemon when you save changes. Check the terminal for any errors during restart.
