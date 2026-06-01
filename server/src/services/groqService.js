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

export async function chatWithGroq(systemPrompt, messages, retries = 0) {
  if (keys.length === 0) {
    throw new Error('Aucune clé GROQ_KEY_* configurée dans .env — configure tes clés API Groq sur console.groq.com');
  }
  if (retries >= keys.length) {
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
      max_tokens: 1024,
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    if (err.status === 429) {
      console.warn(`Clé Groq #${currentKeyIndex} saturée (429), rotation vers la suivante...`);
      return chatWithGroq(systemPrompt, messages, retries + 1);
    }
    throw err;
  }
}
