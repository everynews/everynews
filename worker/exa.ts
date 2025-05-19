import { StoryDto, Strategy } from "@everynews/schema";
import ExaClient from "exa-js";

export const exa = {
  run: async (s: Extract<Strategy, { provider: 'exa' }>) => {
    const client = new ExaClient(process.env.EXA_API_KEY)
    const res = await client.search(s.query)
    console.log(res.results)
    const stories: StoryDto[] = res.results.map((r) => ({
      title: r.title ?? 'Unknown Exa Result',
      url: r.url,
      snippet: r.text,
    }))
    return stories
  },
}
