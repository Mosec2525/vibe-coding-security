# VibeSec v0.8.3 modifications

This build fixes the Custom / Other LLM API key flow and makes provider/model selection safer.

## Fixed AI key behavior
- Saving an API key now also selects that provider as the active provider.
- The Settings page button now says **Save & use** so the behavior is clear.
- Built-in providers still use their correct defaults:
  - Anthropic → `claude-haiku-4-5`
  - OpenAI → `gpt-5-nano`
  - Gemini → `gemini-2.5-flash-lite`
- Testing a provider now reads the model field correctly and falls back to provider defaults for built-in providers.

## Fixed Custom / Other LLM behavior
- Removed the duplicated Custom / Other API key row.
- Custom / Other API key is stored separately in VS Code SecretStorage.
- Custom / Other now requires an exact model name instead of accidentally using a built-in provider model.
- Custom endpoints accept either:
  - full chat completions URL, for example `https://openrouter.ai/api/v1/chat/completions`
  - base `/v1` URL, for example `https://api.groq.com/openai/v1`; VibeSec appends `/chat/completions` automatically.
- Added optional OpenRouter-friendly headers.
- Improved response parsing for OpenAI-compatible providers.

## How to use Custom / Other
1. Settings → AI provider → `Custom / Other`.
2. Write the exact model name from the provider.
3. Write the provider endpoint, preferably the full `/chat/completions` URL.
4. Paste the Custom / Other API key.
5. Click **Save & use**.
6. Click **Test**.
