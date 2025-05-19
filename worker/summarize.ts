import { z } from "zod";

const KagiSummaryResponse = z.object({
  meta: z.object({
    id: z.string(),
    node: z.string(),
    ms: z.number(),
    api_balance: z.number()
  }),
  data: z.object({
    output: z.string().nullable(),
    tokens: z.number()
  }),
  error: z.array(z.object({
    code: z.number(),
    msg: z.string(),
    ref: z.null()
  })).optional()
})

export const summarize = async (s: { url: string }) => {
  console.log('Summarizing', s.url)
  const res = await fetch('https://kagi.com/api/v0/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${process.env.KAGI_TOKEN}`,
    },
    body: JSON.stringify({
      url: s.url,
      engine: 'cecil',
    }),
  });
  const result = KagiSummaryResponse.parse(await res.json())
  if (result.error) {
    console.log('Error summarizing', s.url, result.error)
    return null
  }
  return result.data.output;
};
