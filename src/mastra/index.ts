import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { Observability } from "@mastra/observability";
import { lucie } from "./agents/lucie-agents";
// import {
//   toolCallAppropriatenessScorer,
//   completenessScorer,
//   translationScorer,
// } from "./scorers/lucie-scorer";

export const mastra = new Mastra({
  workflows: {},
  agents: { lucie },
  // scorers: {
  //   toolCallAppropriatenessScorer,
  //   completenessScorer,
  //   translationScorer,
  // },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    // Enables DefaultExporter and CloudExporter for tracing
    default: { enabled: true },
  }),
});
