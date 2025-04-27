// netlify/functions/recommend-services.js

import OpenAI from "openai"

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    }
  }

  try {
    const { problem } = JSON.parse(event.body || "{}")
    if (!problem) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "No problem provided." }),
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const systemPrompt = `
You are an expert at matching business needs to these service slugs:
brand-quickstart, brand-plus, brand-clarity-kit,
podcast-launch-kit, squarespace-website,
social-video-edit, social-graphics-pack.

Reply with only a JSON array of the top 3 slugs, e.g.
["brand-clarity-kit","social-video-edit","squarespace-website"].
    `.trim()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: `Problem: "${problem}"` },
      ],
      temperature: 0.7,
      max_tokens: 60,
    })

    const text = completion.choices[0].message.content.trim()
    let slugs = []
    try {
      slugs = JSON.parse(text)
    } catch {
      slugs = []
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ slugs }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    }
  }
}
