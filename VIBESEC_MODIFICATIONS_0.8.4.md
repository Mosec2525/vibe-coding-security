# VibeSec v0.8.4 changes

## API key / LLM fixes

- Added Groq as a first-class AI provider.
- Groq works by pasting only the Groq API key that starts with `gsk_`.
- VibeSec now automatically uses the Groq OpenAI-compatible endpoint:
  `https://api.groq.com/openai/v1/chat/completions`
- Default Groq model is set to `llama-3.1-8b-instant`.
- If a `gsk_` key is pasted into any API key field, VibeSec automatically saves it as Groq, selects Groq, and sets the Groq default model.
- Custom / Other provider is still available for OpenAI-compatible providers that need a custom endpoint.

## How to use Groq

1. Open Control Center → Settings.
2. Choose AI provider: Groq.
3. Paste the Groq API key in the Groq API key field.
4. Click Save & use.
5. Click Test.
6. Generate prompts from the Analysis panel.
