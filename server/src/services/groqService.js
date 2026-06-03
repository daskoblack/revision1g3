import Groq from 'groq-sdk';

// Rotation des clés Groq pour éviter le rate-limiting (round-robin + fallback 429)
const keys = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextClient() {
  const client = new Groq({ apiKey: keys[currentKeyIndex] });
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return client;
}

// options : { maxTokens, temperature, _retries } — maxTokens élevé requis pour la génération de fiches
export async function chatWithGroq(systemPrompt, messages, options = {}) {
  const { maxTokens = 1024, temperature = 0.7, _retries = 0 } = options;
  if (keys.length === 0) {
    throw new Error('Aucune clé GROQ_KEY_* configurée dans .env — configure tes clés API Groq sur console.groq.com');
  }
  if (_retries >= keys.length) {
    throw new Error('Toutes les clés Groq sont saturées. Réessaie dans quelques instants.');
  }
  const client = getNextClient();
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: maxTokens,
      temperature,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    if (err.status === 429) {
      console.warn(`Clé Groq #${currentKeyIndex} saturée (429), rotation vers la suivante...`);
      return chatWithGroq(systemPrompt, messages, { ...options, _retries: _retries + 1 });
    }
    throw err;
  }
}

export async function analyzeImageWithGroq(prompt, imageBase64, mimeType, retries = 0) {
  if (keys.length === 0) {
    throw new Error('Aucune clé GROQ_KEY_* configurée dans .env — configure tes clés API Groq sur console.groq.com');
  }
  if (retries >= keys.length) {
    throw new Error('Toutes les clés Groq sont saturées. Réessaie dans quelques instants.');
  }
  const client = getNextClient();
  try {
    const completion = await client.chat.completions.create({
      // Modèle vision actuel de Groq (l'ancien llama-3.2-*-vision-preview est décommissionné)
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1536,
      temperature: 0.2,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    if (err.status === 429) {
      console.warn(`Clé Groq #${currentKeyIndex} saturée (429), rotation vers la suivante pour la vision...`);
      return analyzeImageWithGroq(prompt, imageBase64, mimeType, retries + 1);
    }
    throw err;
  }
}
