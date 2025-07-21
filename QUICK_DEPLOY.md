# Quick Deployment Reference

Fast setup guide for the most common deployment scenarios.

## 🚀 Netlify (Most Popular)

### 1. Get OpenAI API Key
- Go to [platform.openai.com](https://platform.openai.com)
- API Keys → Create new secret key
- Copy key (starts with `sk-proj-`)

### 2. Add to Netlify
- Netlify Dashboard → Your Site → Site settings → Environment variables
- Add variable:
  ```
  Name: LLM_API_KEY
  Value: sk-proj-your-key-here
  ```

### 3. Deploy & Test
- Save → Auto-deploys
- Visit site → Console should show: `🤖 LLM enabled via environment variables`
- Test: Upload business card → Better OCR accuracy

---

## 💰 Cost-Effective Setup (OpenRouter)

### 1. Get OpenRouter API Key
- Go to [openrouter.ai](https://openrouter.ai)
- Sign up → Keys → Create key
- Copy key (starts with `sk-or-`)

### 2. Add Environment Variables
```
LLM_API_KEY=sk-or-your-key-here
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3-haiku
```

### 3. Cost
- ~$0.0005 per business card (vs $0.001 for OpenAI)

---

## ⚡ Ultra-Fast Setup (Together AI)

### 1. Get Together AI Key
- Go to [api.together.xyz](https://api.together.xyz)
- Sign up → API Keys → Create
- Copy key

### 2. Environment Variables
```
LLM_API_KEY=your-together-key
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/llama-3.1-8b-instruct
```

### 3. Benefits
- Fastest processing
- Lowest cost (~$0.0002 per card)

---

## 🔧 Platform Quick Setup

### Netlify
```bash
# Site settings → Environment variables → Add variable
LLM_API_KEY=your-key-here
```

### Vercel
```bash
# Settings → Environment Variables → Add
LLM_API_KEY=your-key-here
# Select: Production, Preview, Development
```

### Railway
```bash
# Variables tab → New Variable
LLM_API_KEY=your-key-here
```

### Render
```bash
# Environment tab → Add Environment Variable
LLM_API_KEY=your-key-here
```

---

## ✅ Quick Test

1. **Deploy** with environment variables
2. **Visit** your site
3. **Open** browser console (F12)
4. **Look for**: `🤖 LLM enabled via environment variables`
5. **Test**: Go to Scan Card → Upload image → Check accuracy

---

## 🆘 Quick Troubleshooting

### LLM Not Working?
1. Check variable name: `LLM_API_KEY` (case-sensitive)
2. Verify API key is active
3. Redeploy after adding variables
4. Check console for error messages

### Still Having Issues?
- See full [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Check [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- Test API key with provider's playground first

---

## 📊 Provider Comparison

| Provider | Cost/Card | Speed | Quality | Setup |
|----------|-----------|-------|---------|-------|
| **OpenAI** | $0.001 | Fast | Excellent | Easy |
| **OpenRouter** | $0.0005 | Fast | Excellent | Easy |
| **Together AI** | $0.0002 | Fastest | Good | Easy |
| **Anthropic** | $0.0008 | Fast | Excellent | Medium |

**Recommendation**: Start with **OpenRouter** for best cost/quality balance.

---

## 🎯 Success Indicators

After deployment, you should see:

### Console Messages
```
🤖 LLM enabled via environment variables
✅ LLM configuration updated: {enabled: true, ...}
```

### Settings Page
- AI Enhancement section shows: `🤖 LLM Enabled`

### OCR Processing
```
🤖 Sending to LLM for validation and correction...
✅ LLM corrected data: {...}
```

### Improved Results
- Better name extraction (proper case)
- Complete job titles
- Full company names
- Accurate field mapping

**Your AI Contact Manager is now production-ready!** 🚀
