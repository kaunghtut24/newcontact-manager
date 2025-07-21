# Environment Variables Setup

The AI Contact Manager supports environment variables for secure API key management and configuration.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   LLM_API_KEY=your_actual_api_key_here
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-3.5-turbo
   ```

3. **Restart your development server**

## Supported Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LLM_API_KEY` | API key for your LLM provider | None | `sk-...` |
| `LLM_BASE_URL` | Base URL for API calls | `https://api.openai.com/v1` | `https://openrouter.ai/api/v1` |
| `LLM_MODEL` | Model name to use | `gpt-3.5-turbo` | `claude-3-haiku-20240307` |
| `LLM_MAX_TOKENS` | Maximum response tokens | `500` | `1000` |
| `LLM_TEMPERATURE` | Response creativity (0.0-1.0) | `0.1` | `0.3` |

## Provider Examples

### OpenAI
```env
LLM_API_KEY=sk-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```

### OpenRouter (Cost-effective)
```env
LLM_API_KEY=sk-or-your-openrouter-key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3-haiku
```

### Together AI
```env
LLM_API_KEY=your-together-key
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/llama-3.1-8b-instruct
```

### Anthropic
```env
LLM_API_KEY=sk-ant-your-anthropic-key
LLM_BASE_URL=https://api.anthropic.com
LLM_MODEL=claude-3-haiku-20240307
```

## Deployment

### Netlify
1. Go to Site settings > Environment variables
2. Add each variable with its value
3. Redeploy your site

### Vercel
1. Go to Project settings > Environment Variables
2. Add each variable for Production/Preview/Development
3. Redeploy

### Railway/Render
1. Add environment variables in your service configuration
2. Redeploy the service

### Docker
```bash
docker run --env-file .env your-image
```

## Security Best Practices

1. **Never commit `.env` files** - Add `.env` to your `.gitignore`
2. **Use API key restrictions** when available
3. **Rotate keys regularly**
4. **Use different keys for development/production**
5. **Monitor API usage** for unexpected activity

## Fallback Configuration

If environment variables are not set, users can still configure the LLM through the Settings UI. However, environment variables take precedence and are more secure for production deployments.
