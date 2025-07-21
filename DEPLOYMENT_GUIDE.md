# AI Contact Manager - Deployment Guide

Complete guide for deploying the AI Contact Manager with LLM integration using environment variables.

## 🚀 Quick Start

1. **Choose your LLM provider** (OpenAI, OpenRouter, Together AI, etc.)
2. **Get your API key** from the provider
3. **Set environment variables** on your hosting platform
4. **Deploy and test** the LLM integration

---

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LLM_API_KEY` | Your LLM provider API key | `sk-proj-abc123...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LLM_BASE_URL` | API endpoint URL | `https://api.openai.com/v1` | `https://openrouter.ai/api/v1` |
| `LLM_MODEL` | Model name | `gpt-3.5-turbo` | `claude-3-haiku-20240307` |
| `LLM_MAX_TOKENS` | Response token limit | `500` | `1000` |
| `LLM_TEMPERATURE` | Creativity (0.0-1.0) | `0.1` | `0.3` |

---

## 🌐 Platform-Specific Setup

### Netlify Deployment

#### Step 1: Access Environment Variables
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (e.g., `contact-manager25.netlify.app`)
3. Navigate to: **Site settings** → **Environment variables**
4. Click: **Add a variable**

#### Step 2: Add Variables
Add these one by one:

```
Variable name: LLM_API_KEY
Value: sk-proj-your-actual-api-key-here
Scopes: All scopes
```

```
Variable name: LLM_BASE_URL
Value: https://api.openai.com/v1
Scopes: All scopes
```

```
Variable name: LLM_MODEL
Value: gpt-3.5-turbo
Scopes: All scopes
```

#### Step 3: Deploy
- Click **Save** after adding each variable
- Netlify will automatically trigger a new deployment
- Wait for deployment to complete

#### Step 4: Verify
1. Visit your deployed site
2. Open browser console (F12)
3. Look for: `🤖 LLM enabled via environment variables`
4. Test OCR functionality

### Vercel Deployment

#### Step 1: Access Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**

#### Step 2: Add Variables
For each environment (Production, Preview, Development):

```
Name: LLM_API_KEY
Value: sk-proj-your-actual-api-key-here
Environment: Production, Preview, Development
```

#### Step 3: Redeploy
- Click **Save**
- Go to **Deployments** tab
- Click **Redeploy** on latest deployment

### Railway Deployment

#### Step 1: Access Variables
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Navigate to: **Variables** tab

#### Step 2: Add Variables
Click **New Variable** for each:

```
LLM_API_KEY=sk-proj-your-actual-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```

#### Step 3: Deploy
- Railway automatically redeploys when variables change
- Monitor deployment in the **Deployments** tab

### Render Deployment

#### Step 1: Access Environment
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Navigate to: **Environment** tab

#### Step 2: Add Variables
Click **Add Environment Variable**:

```
Key: LLM_API_KEY
Value: sk-proj-your-actual-api-key-here
```

#### Step 3: Deploy
- Click **Save Changes**
- Render will automatically redeploy

---

## 🔑 LLM Provider Setup

### OpenAI (Recommended for Quality)

#### Get API Key:
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to: **API Keys**
3. Click: **Create new secret key**
4. Copy the key (starts with `sk-proj-`)

#### Environment Variables:
```
LLM_API_KEY=sk-proj-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```

#### Cost: ~$0.001 per business card

### OpenRouter (Recommended for Cost)

#### Get API Key:
1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up and navigate to: **Keys**
3. Create a new key
4. Copy the key (starts with `sk-or-`)

#### Environment Variables:
```
LLM_API_KEY=sk-or-your-openrouter-key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3-haiku
```

#### Cost: ~$0.0005 per business card

### Together AI (Fast & Affordable)

#### Get API Key:
1. Go to [Together AI](https://api.together.xyz)
2. Sign up and navigate to: **API Keys**
3. Create a new key
4. Copy the key

#### Environment Variables:
```
LLM_API_KEY=your-together-key
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/llama-3.1-8b-instruct
```

#### Cost: ~$0.0002 per business card

### Anthropic (High Quality)

#### Get API Key:
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Navigate to: **API Keys**
3. Create a new key
4. Copy the key (starts with `sk-ant-`)

#### Environment Variables:
```
LLM_API_KEY=sk-ant-your-anthropic-key
LLM_BASE_URL=https://api.anthropic.com
LLM_MODEL=claude-3-haiku-20240307
```

#### Cost: ~$0.0008 per business card

---

## 🧪 Testing Your Deployment

### Step 1: Check Console Logs
1. Open your deployed site
2. Press F12 to open developer tools
3. Go to **Console** tab
4. Look for these messages:
   ```
   🤖 LLM enabled via environment variables
   ✅ LLM configuration updated: {enabled: true, ...}
   ```

### Step 2: Test LLM Connection
1. Go to **Settings** page
2. Scroll to **AI Enhancement** section
3. Should show: `🤖 LLM Enabled`
4. Click **Test Connection** (optional)

### Step 3: Test OCR Enhancement
1. Go to **Scan Card** page
2. Upload a business card image
3. Watch console for:
   ```
   🤖 Sending to LLM for validation and correction...
   ✅ LLM corrected data: {...}
   ```
4. Verify improved contact field accuracy

### Step 4: Verify Contact Saving
1. After OCR processing completes
2. Click **Save Contact**
3. Check that contact appears in **Contacts** view
4. Verify all fields are properly populated

---

## 🔒 Security Best Practices

### API Key Security
- ✅ **Use environment variables** (not Settings UI in production)
- ✅ **Rotate keys regularly** (monthly recommended)
- ✅ **Use different keys** for different environments
- ✅ **Monitor API usage** for unexpected activity
- ✅ **Set usage limits** when available

### Access Control
- ✅ **Restrict API keys** to specific domains when possible
- ✅ **Use least privilege** - only necessary permissions
- ✅ **Monitor deployment logs** for security issues

### Cost Management
- ✅ **Set spending limits** on your LLM provider account
- ✅ **Monitor usage** regularly
- ✅ **Use cost-effective models** for development
- ✅ **Implement rate limiting** if needed

---

## 🐛 Troubleshooting

### LLM Not Enabled
**Problem**: Console shows "LLM Disabled"
**Solutions**:
1. Check environment variable names (case-sensitive)
2. Verify API key is correct and active
3. Check deployment logs for errors
4. Ensure variables are set for correct environment

### API Connection Errors
**Problem**: "Failed to fetch" or CORS errors
**Solutions**:
1. Verify `LLM_BASE_URL` is correct
2. Check API key permissions
3. Ensure Content Security Policy allows the domain
4. Test API key with curl/Postman

### OCR Not Improving
**Problem**: LLM enabled but no accuracy improvement
**Solutions**:
1. Check console for LLM processing logs
2. Verify model name is correct
3. Test with clear, high-quality business card images
4. Check API usage/quota limits

### Cost Issues
**Problem**: Unexpected high costs
**Solutions**:
1. Check `LLM_MAX_TOKENS` setting (default: 500)
2. Monitor API usage dashboard
3. Consider switching to cheaper model
4. Implement usage tracking

---

## 📞 Support

### Documentation
- [Environment Setup Guide](ENVIRONMENT_SETUP.md)
- [API Provider Documentation](#llm-provider-setup)

### Community
- Create GitHub issues for bugs
- Check existing issues for solutions
- Contribute improvements via pull requests

### Provider Support
- **OpenAI**: [Platform Help](https://help.openai.com)
- **OpenRouter**: [Documentation](https://openrouter.ai/docs)
- **Together AI**: [Support](https://docs.together.ai)
- **Anthropic**: [Documentation](https://docs.anthropic.com)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Choose LLM provider
- [ ] Obtain API key
- [ ] Test API key locally (optional)
- [ ] Prepare environment variables

### Deployment
- [ ] Add environment variables to hosting platform
- [ ] Deploy/redeploy application
- [ ] Verify deployment success

### Post-Deployment
- [ ] Check console for "LLM enabled" message
- [ ] Test LLM connection in Settings
- [ ] Upload test business card
- [ ] Verify OCR accuracy improvement
- [ ] Monitor API usage and costs

### Ongoing Maintenance
- [ ] Monitor API usage monthly
- [ ] Rotate API keys quarterly
- [ ] Update models as needed
- [ ] Review costs and optimize

**Your AI Contact Manager is now ready for production with secure, scalable LLM integration!** 🚀
