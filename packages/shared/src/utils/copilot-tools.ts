import { CopilotTool } from '../types/admin.type';

/**
 * The only things the ops copilot may do. The LLM never writes SQL:
 * it picks one of these tools, and its arguments are checked here before anything runs.
 */
export const COPILOT_MAX_RANGE_DAYS = 366;
export const COPILOT_MAX_ROWS = 50;
export const COPILOT_GROUP_BY = ['product', 'customer', 'warehouse', 'day'] as const;
export type CopilotGroupBy = (typeof COPILOT_GROUP_BY)[number];

export type CopilotCall =
  | { tool: 'salesSummary'; params: { from: string; to: string; groupBy: CopilotGroupBy } }
  | { tool: 'topCustomers'; params: { from: string; to: string; limit: number } }
  | { tool: 'lowStock'; params: { thresholdTon: number } }
  | { tool: 'contractPipeline'; params: Record<string, never> };

export type CopilotValidation = { ok: true; call: CopilotCall } | { ok: false; error: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkRange(from: unknown, to: unknown): string | null {
  if (typeof from !== 'string' || typeof to !== 'string' || !DATE.test(from) || !DATE.test(to)) {
    return 'from/to must be YYYY-MM-DD';
  }
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 'invalid date';
  if (a > b) return 'from must not be after to';
  if ((b - a) / 86_400_000 > COPILOT_MAX_RANGE_DAYS) return 'date range is limited to one year';
  return null;
}

/** Checks a tool call proposed by the model. Unknown tools and bad arguments are rejected. */
export function validateCopilotCall(tool: unknown, args: unknown): CopilotValidation {
  const a = (args && typeof args === 'object' ? args : {}) as Record<string, unknown>;

  switch (tool) {
    case CopilotTool.SALES_SUMMARY: {
      const rangeError = checkRange(a.from, a.to);
      if (rangeError) return { ok: false, error: rangeError };
      const groupBy = a.groupBy ?? 'product';
      if (!COPILOT_GROUP_BY.includes(groupBy as CopilotGroupBy)) {
        return { ok: false, error: `groupBy must be one of ${COPILOT_GROUP_BY.join(', ')}` };
      }
      return {
        ok: true,
        call: {
          tool,
          params: {
            from: a.from as string,
            to: a.to as string,
            groupBy: groupBy as CopilotGroupBy,
          },
        },
      };
    }
    case CopilotTool.TOP_CUSTOMERS: {
      const rangeError = checkRange(a.from, a.to);
      if (rangeError) return { ok: false, error: rangeError };
      const limit = a.limit ?? 5;
      if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 10) {
        return { ok: false, error: 'limit must be an integer 1–10' };
      }
      return {
        ok: true,
        call: { tool, params: { from: a.from as string, to: a.to as string, limit } },
      };
    }
    case CopilotTool.LOW_STOCK: {
      const threshold = a.thresholdTon ?? 10;
      if (typeof threshold !== 'number' || !(threshold >= 0 && threshold <= 1000)) {
        return { ok: false, error: 'thresholdTon must be a number 0–1000' };
      }
      return { ok: true, call: { tool, params: { thresholdTon: threshold } } };
    }
    case CopilotTool.CONTRACT_PIPELINE:
      return { ok: true, call: { tool, params: {} } };
    default:
      return { ok: false, error: 'unknown tool' };
  }
}
