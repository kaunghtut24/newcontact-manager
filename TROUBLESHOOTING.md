# Troubleshooting Guide

Common issues and solutions for AI Contact Manager deployment.

## 🔍 Diagnostic Steps

### Step 1: Check Console Messages
Open browser console (F12) and look for these messages:

#### ✅ Success Messages
```
🤖 LLM enabled via environment variables
✅ LLM configuration updated: {enabled: true, baseURL: "...", model: "...", hasApiKey: true}
📱 Touch device detected, applying mobile optimizations
```

#### ❌ Problem Messages
```
🤖 LLM Disabled
❌ LLM connection test failed: TypeError: Failed to fetch
❌ LLM validation error: ...
```

### Step 2: Check Settings Page
Navigate to Settings → AI Enhancement section:

#### ✅ Working
- Status shows: `🤖 LLM Enabled`
- Test Connection button works

#### ❌ Not Working
- Status shows: `🤖 LLM Disabled`
- Test Connection fails

---

## 🚨 Common Issues & Solutions

### Issue 1: LLM Not Enabled

#### Symptoms
- Console shows: `🤖 LLM Disabled`
- Settings shows: `🤖 LLM Disabled`
- No LLM processing during OCR

#### Causes & Solutions

**Cause**: Environment variable not set
```bash
# Solution: Add to your hosting platform
LLM_API_KEY=your-actual-api-key
```

**Cause**: Wrong variable name
```bash
# Wrong ❌
OPENAI_API_KEY=sk-proj-...
API_KEY=sk-proj-...

# Correct ✅
LLM_API_KEY=sk-proj-...
```

**Cause**: Variable not deployed
- **Solution**: Redeploy after adding environment variables
- **Netlify**: Variables → Save → Auto-redeploy
- **Vercel**: Variables → Save → Manual redeploy
- **Railway**: Auto-redeploys on variable change

### Issue 2: API Connection Errors

#### Symptoms
```
❌ LLM connection test failed: TypeError: Failed to fetch
Refused to connect because it violates Content Security Policy
```

#### Solutions

**CSP Issue**: Update Content Security Policy
- Check if your hosting platform blocks external API calls
- Verify the CSP meta tag includes your LLM provider domain

**Wrong Base URL**:
```bash
# Check your LLM_BASE_URL
OpenAI: https://api.openai.com/v1
OpenRouter: https://openrouter.ai/api/v1
Together AI: https://api.together.xyz/v1
Anthropic: https://api.anthropic.com
```

**Invalid API Key**:
- Verify key is active on provider dashboard
- Check key permissions/scopes
- Try regenerating the key

### Issue 3: OCR Not Improving

#### Symptoms
- LLM enabled but OCR results still poor
- No console messages about LLM processing
- Contact fields still incorrectly mapped

#### Solutions

**Check Processing Logs**:
Look for these console messages during OCR:
```
🤖 Sending to LLM for validation and correction...
✅ LLM corrected data: {...}
```

**Model Issues**:
```bash
# Try different models
LLM_MODEL=gpt-3.5-turbo          # OpenAI
LLM_MODEL=anthropic/claude-3-haiku  # OpenRouter
LLM_MODEL=meta-llama/llama-3.1-8b-instruct  # Together AI
```

**Image Quality**:
- Use clear, high-resolution business card images
- Ensure good lighting and contrast
- Avoid blurry or rotated images

### Issue 4: High Costs

#### Symptoms
- Unexpected API charges
- Rapid token consumption

#### Solutions

**Reduce Token Usage**:
```bash
# Lower max tokens
LLM_MAX_TOKENS=300  # Default is 500

# Lower temperature for more focused responses
LLM_TEMPERATURE=0.05  # Default is 0.1
```

**Switch to Cheaper Model**:
```bash
# Cost comparison (per 1K tokens)
gpt-3.5-turbo: $0.0015
anthropic/claude-3-haiku: $0.00025
meta-llama/llama-3.1-8b-instruct: $0.0002
```

**Monitor Usage**:
- Check provider dashboard regularly
- Set spending limits
- Use development keys for testing

### Issue 5: Mobile Touch Issues

#### Symptoms
- Buttons not responding on mobile
- No visual feedback on touch
- Inconsistent behavior across views

#### Solutions

**Check Touch Device Detection**:
Console should show:
```
📱 Touch device detected, applying mobile optimizations
📱 Adding touch handlers to X elements
```

**Force Touch Optimization**:
```javascript
// In browser console, force touch mode
document.body.classList.add('touch-device');
contactManager.addTouchEventHandlers();
```

**Clear Browser Cache**:
- Hard refresh (Ctrl+Shift+R)
- Clear site data in browser settings
- Try incognito/private mode

---

## 🔧 Advanced Debugging

### Enable Debug Mode
Add to environment variables:
```bash
DEBUG=true
LOG_LEVEL=debug
```

### Test API Key Manually
```bash
# Test OpenAI key
curl -H "Authorization: Bearer sk-proj-your-key" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}],"max_tokens":10}' \
     https://api.openai.com/v1/chat/completions

# Test OpenRouter key
curl -H "Authorization: Bearer sk-or-your-key" \
     -H "Content-Type: application/json" \
     -d '{"model":"anthropic/claude-3-haiku","messages":[{"role":"user","content":"Hello"}],"max_tokens":10}' \
     https://openrouter.ai/api/v1/chat/completions
```

### Check Network Tab
1. Open DevTools → Network tab
2. Upload business card
3. Look for API calls to your LLM provider
4. Check response status and errors

### Verify Environment Variables
```javascript
// In browser console
console.log('Environment check:', {
  hasApiKey: !!contactManager.llmConfig.apiKey,
  baseURL: contactManager.llmConfig.baseURL,
  model: contactManager.llmConfig.model,
  enabled: contactManager.llmConfig.enabled
});
```

---

## 📋 Troubleshooting Checklist

### Basic Checks
- [ ] Environment variable `LLM_API_KEY` is set
- [ ] Variable name is exactly `LLM_API_KEY` (case-sensitive)
- [ ] API key is valid and active
- [ ] Site has been redeployed after adding variables

### Advanced Checks
- [ ] Console shows LLM enabled message
- [ ] Settings page shows LLM enabled status
- [ ] Test Connection works in Settings
- [ ] OCR processing shows LLM validation logs
- [ ] Network tab shows successful API calls

### Mobile Checks
- [ ] Touch device detection working
- [ ] Touch handlers applied to elements
- [ ] Visual feedback on button press
- [ ] All views respond to touch

### Performance Checks
- [ ] API response times reasonable (<5 seconds)
- [ ] Token usage within expected limits
- [ ] No rate limiting errors
- [ ] Costs align with usage expectations

---

## 🆘 Getting Help

### Self-Service
1. **Check this troubleshooting guide**
2. **Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**
3. **Test with provider's playground/console**
4. **Try different API key or provider**

### Community Support
1. **Search existing GitHub issues**
2. **Create new issue with:**
   - Console error messages
   - Environment variable setup (without API key)
   - Steps to reproduce
   - Expected vs actual behavior

### Provider Support
- **OpenAI**: [help.openai.com](https://help.openai.com)
- **OpenRouter**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Together AI**: [docs.together.ai](https://docs.together.ai)
- **Anthropic**: [docs.anthropic.com](https://docs.anthropic.com)

---

## ✅ Success Verification

After resolving issues, verify everything works:

### 1. Console Check
```
✅ 🤖 LLM enabled via environment variables
✅ 📱 Touch device detected, applying mobile optimizations
✅ ✅ LLM configuration updated: {enabled: true, ...}
```

### 2. Functionality Check
- [ ] Settings shows LLM enabled
- [ ] Test Connection succeeds
- [ ] OCR processes with LLM validation
- [ ] Contact fields accurately extracted
- [ ] Mobile touch works on all views

### 3. Performance Check
- [ ] OCR completes within 10 seconds
- [ ] API costs reasonable
- [ ] No console errors
- [ ] Smooth user experience

**Your AI Contact Manager should now be working perfectly!** 🎉
