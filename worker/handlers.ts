import { Strategy } from "@everynews/schema";
import { Worker } from "@everynews/worker/type";
import { hnbest } from "./hnbest";
import { exa } from "./exa";

export const handlers = {
  hnbest: async (s: Extract<Strategy, { provider: 'hnbest' }>) => {
    return hnbest.run(s)
  },
  exa: async (s: Extract<Strategy, { provider: 'exa' }>) => {
    return exa.run(s)
  },
} satisfies { [K in Strategy['provider']]: Worker<K> };
