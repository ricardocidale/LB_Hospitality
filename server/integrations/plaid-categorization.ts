import { getAnthropicClient } from "../ai/clients";

export const USALI_CATEGORIES = {
  "Rooms Revenue": "Rooms",
  "F&B Revenue": "Food & Beverage",
  "Events Revenue": "Events",
  "Other Revenue": "Other Operating",
  "Rooms Expense": "Rooms",
  "F&B Expense": "Food & Beverage",
  "Events Expense": "Events",
  "Other Expense": "Other Operating",
  "Admin & General": "Undistributed",
  "Marketing": "Undistributed",
  "Property Operations": "Undistributed",
  "Utilities": "Undistributed",
  "IT & Telecom": "Undistributed",
  "Insurance": "Fixed Charges",
  "Property Taxes": "Fixed Charges",
  "FF&E Reserve": "Capital",
  "Management Fee": "Management",
  "Debt Service": "Below the Line",
  "Capital Expenditure": "Capital",
  "Uncategorized": "Other",
} as const;

export type UsaliCategory = keyof typeof USALI_CATEGORIES;

interface RuleMatch {
  pattern: RegExp;
  mcc?: string[];
  usaliCategory: UsaliCategory;
}

const RULES: RuleMatch[] = [
  { pattern: /hilton|marriott|hyatt|ihg|wyndham|best western|choice hotels/i, usaliCategory: "Rooms Revenue" },
  { pattern: /hotel.*revenue|room.*revenue|lodging.*income|booking\.com|expedia.*payout/i, usaliCategory: "Rooms Revenue" },
  { pattern: /restaurant|dining|grubhub|doordash|uber eats|sysco|us foods|food.*supply/i, usaliCategory: "F&B Expense" },
  { mcc: ["5812", "5813", "5814"], pattern: /^$/, usaliCategory: "F&B Expense" },
  { pattern: /catering.*revenue|banquet.*revenue|event.*revenue|wedding.*income/i, usaliCategory: "Events Revenue" },
  { pattern: /catering.*expense|event.*rental|av.*equipment|party.*supply/i, usaliCategory: "Events Expense" },
  { pattern: /adp.*payroll|paychex|gusto.*payroll|salary|wages|payroll/i, usaliCategory: "Admin & General" },
  { pattern: /google.*ads|facebook.*ads|meta.*ads|yelp.*ads|tripadvisor|marketing|advertis/i, usaliCategory: "Marketing" },
  { pattern: /hvac|plumbing|electrician|maintenance|repair|janitorial|cleaning|housekeep/i, usaliCategory: "Property Operations" },
  { pattern: /electric.*bill|gas.*bill|water.*bill|sewer|utility|power company|energy/i, usaliCategory: "Utilities" },
  { pattern: /comcast|at&t|verizon|t-mobile|internet|wifi|phone.*service|software|saas|microsoft|google workspace|adobe/i, usaliCategory: "IT & Telecom" },
  { pattern: /insurance.*premium|liability.*insurance|workers.*comp|property.*insurance/i, usaliCategory: "Insurance" },
  { pattern: /property.*tax|real.*estate.*tax|county.*tax|municipal.*tax/i, usaliCategory: "Property Taxes" },
  { pattern: /mortgage|loan.*payment|interest.*payment|bank.*loan|debt.*service/i, usaliCategory: "Debt Service" },
  { pattern: /renovation|capital.*improve|furniture|fixture|equipment.*purchase/i, usaliCategory: "Capital Expenditure" },
  { pattern: /management.*fee|hbg.*fee|operator.*fee/i, usaliCategory: "Management Fee" },
  { pattern: /spa.*revenue|gift.*shop|parking.*revenue|laundry.*revenue|misc.*revenue/i, usaliCategory: "Other Revenue" },
  { pattern: /office.*supply|legal.*fee|accounting.*fee|audit|consulting|license.*fee/i, usaliCategory: "Admin & General" },
  { pattern: /linen|amenities|guest.*supply|minibar|toiletries/i, usaliCategory: "Rooms Expense" },
];

export interface CategorizationResult {
  usaliCategory: UsaliCategory;
  usaliDepartment: string;
  method: "rule" | "cache" | "ai";
}

export function categorizeByRules(name: string, merchantName?: string | null, mcc?: string | null): CategorizationResult | null {
  const searchText = `${name} ${merchantName || ""}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.mcc && mcc && rule.mcc.includes(mcc)) {
      return {
        usaliCategory: rule.usaliCategory,
        usaliDepartment: USALI_CATEGORIES[rule.usaliCategory],
        method: "rule",
      };
    }
    if (rule.pattern.source !== "^$" && rule.pattern.test(searchText)) {
      return {
        usaliCategory: rule.usaliCategory,
        usaliDepartment: USALI_CATEGORIES[rule.usaliCategory],
        method: "rule",
      };
    }
  }

  return null;
}

export async function categorizeByAI(
  descriptions: string[]
): Promise<Map<string, { usaliCategory: UsaliCategory; usaliDepartment: string }>> {
  const results = new Map<string, { usaliCategory: UsaliCategory; usaliDepartment: string }>();

  if (descriptions.length === 0) return results;

  const categoryList = Object.keys(USALI_CATEGORIES).join(", ");

  try {
    const client = getAnthropicClient();
    const prompt = `You are a hotel accounting expert using the USALI (Uniform System of Accounts for the Lodging Industry) framework.

Categorize each bank transaction description into one of these USALI categories:
${categoryList}

For each transaction, determine if it's a revenue or expense based on context. Hotel-related credits are revenue; debits are expenses.

Respond with a JSON array where each element has:
- "description": the original description
- "usaliCategory": one of the categories listed above
- "usaliDepartment": the department from this mapping

Transactions to categorize:
${descriptions.map((d, i) => `${i + 1}. "${d}"`).join("\n")}

Respond ONLY with the JSON array, no other text.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        description: string;
        usaliCategory: string;
        usaliDepartment?: string;
      }>;

      for (const item of parsed) {
        const category = item.usaliCategory as UsaliCategory;
        if (category in USALI_CATEGORIES) {
          results.set(item.description, {
            usaliCategory: category,
            usaliDepartment: USALI_CATEGORIES[category],
          });
        }
      }
    }
  } catch (error) {
    console.error("AI categorization failed:", error);
  }

  for (const desc of descriptions) {
    if (!results.has(desc)) {
      results.set(desc, {
        usaliCategory: "Uncategorized",
        usaliDepartment: USALI_CATEGORIES["Uncategorized"],
      });
    }
  }

  return results;
}
