# Custom Domain Redirect Feature

## Overview
Automatically redirects users from `subdomain.nepostore.xyz` to the custom domain when a store has a custom domain configured.

## How It Works

### Scenario
- **Store Name**: NEPO Store
- **Subdomain**: `nepostore.nepostore.xyz`
- **Custom Domain**: `suprajshrestha.com.np`

### Behavior

#### Before (Without Redirect)
Users could access the store via both URLs:
- ✅ `https://nepostore.nepostore.xyz` → Shows store
- ✅ `https://suprajshrestha.com.np` → Shows store

**Problem**: This creates duplicate content issues for SEO and confuses users.

#### After (With Redirect)
- ❌ `https://nepostore.nepostore.xyz` → **Redirects to** → `https://suprajshrestha.com.np` ✅
- ✅ `https://suprajshrestha.com.np` → Shows store

**Benefits**:
- ✅ Single canonical URL for SEO
- ✅ Professional branding (custom domain only)
- ✅ Prevents duplicate content penalties
- ✅ Better user experience

## Technical Details

### Redirect Type
- **HTTP Status Code**: 301 (Permanent Redirect)
- **Why 301?**: Tells search engines that the subdomain has permanently moved to the custom domain

### When Redirect Happens
The redirect middleware checks:
1. ✅ Is the request coming to `*.nepostore.xyz`?
2. ✅ Is it NOT a reserved subdomain (`app`, `www`, `api`)?
3. ✅ Does the store have a `customDomain` configured?
4. ✅ If all true → Redirect to custom domain

### When Redirect Does NOT Happen
- ❌ Localhost requests (`*.localhost:3000`) - for development
- ❌ Reserved subdomains (`app.nepostore.xyz`, `www.nepostore.xyz`)
- ❌ Stores without custom domain configured
- ❌ Custom domain requests (already on custom domain)

## Examples

### Example 1: Store with Custom Domain
```
Store: Fashion Store
Subdomain: fashion
Custom Domain: fashionstore.com

Request: https://fashion.nepostore.xyz/products
Result: 301 Redirect → https://fashionstore.com/products
```

### Example 2: Store without Custom Domain
```
Store: Tech Store
Subdomain: techstore
Custom Domain: (not configured)

Request: https://techstore.nepostore.xyz/products
Result: Shows store normally (no redirect)
```

### Example 3: Dashboard Access
```
Request: https://app.nepostore.xyz/dashboard
Result: Shows dashboard (no redirect - reserved subdomain)
```

### Example 4: Development/Localhost
```
Request: http://nepostore.localhost:3000/products
Result: Shows store normally (no redirect - localhost)
```

## Configuration

### Setting Up Custom Domain

1. **In Dashboard → Store Settings**:
   - Enter your custom domain (e.g., `mystore.com`)
   - Save settings

2. **DNS Configuration**:
   - Add CNAME record: `mystore.com` → `nepostore.xyz`
   - Or A record pointing to server IP

3. **SSL Certificate** (Production):
   - Configure SSL for custom domain
   - Ensure HTTPS works

### Testing

#### On Production:
```bash
# Should redirect
curl -I https://nepostore.nepostore.xyz

# Expected response:
HTTP/2 301
Location: https://suprajshrestha.com.np
```

#### On Localhost:
```bash
# Should NOT redirect (for development)
curl -I http://nepostore.localhost:3000

# Expected response:
HTTP/1.1 200 OK
```

## SEO Benefits

### Canonical URL
The redirect ensures:
- Search engines index only the custom domain
- No duplicate content penalties
- Link equity consolidates to custom domain
- Better brand recognition

### Recommended Additional SEO Setup
Add canonical tags in your HTML:
```html
<link rel="canonical" href="https://suprajshrestha.com.np/current-page" />
```

## Troubleshooting

### Redirect Loop
**Symptom**: Browser shows "Too many redirects"

**Causes**:
1. Custom domain DNS points back to subdomain
2. Reverse proxy misconfiguration

**Solution**:
- Check DNS records
- Ensure custom domain points to server IP or correct CNAME
- Verify `req.hostname` is correctly detected

### Redirect Not Working
**Symptom**: Subdomain still shows content instead of redirecting

**Check**:
1. Is custom domain saved in database?
   ```javascript
   db.clients.findOne({ subdomain: "yourstore" })
   // Check customDomain field
   ```

2. Is request on production domain?
   - Redirect only works on `*.nepostore.xyz`
   - Localhost requests are not redirected

3. Check server logs for `[Redirect]` messages

### Want to Disable Redirect
If you need to temporarily disable the redirect:

**Option 1**: Remove custom domain from store settings

**Option 2**: Comment out the redirect middleware in `server/index.js`:
```javascript
// app.use((req, res, next) => {
//   ... redirect logic ...
// });
```

## Code Location
- **File**: `server/index.js`
- **Lines**: After `subdomainHandler` middleware
- **Function**: Redirect middleware

## Related Features
- Tenant Identification (`subdomainHandler`)
- Custom Domain Support
- SEO Settings
- Store Settings Management

---

**Note**: This feature only affects production URLs (`*.nepostore.xyz`). Development URLs (`*.localhost:3000`) are never redirected to allow local testing.
