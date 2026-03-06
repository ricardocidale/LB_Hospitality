import { ElevenLabsClient } from "elevenlabs";
import {
  createMultiAgentSystem,
  generateOrchestratorPrompt,
  buildTransferToNumberTool,
} from "../helpers/multi-agent";

async function setupHotelMultiAgentSystem() {
  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  const companyName = "Grand Hotel";

  const departments = [
    {
      name: "Reservations",
      description:
        "Room bookings, availability checks, date changes, cancellations",
    },
    {
      name: "Concierge",
      description:
        "Local recommendations, restaurant reservations, transportation, activities",
    },
    {
      name: "Guest Services",
      description:
        "Room issues, maintenance requests, amenities, complaints, billing",
    },
  ];

  const orchestratorPrompt = generateOrchestratorPrompt(
    companyName,
    departments
  );

  const result = await createMultiAgentSystem(
    client,
    {
      name: `${companyName} - Front Desk`,
      prompt: orchestratorPrompt,
      firstMessage: `Hello, thank you for calling ${companyName}. How may I assist you today?`,
      voice: "cgSgspJ2msm6clMCkdW9",
      llm: "gpt-4o-mini",
    },
    [
      {
        name: `${companyName} - Reservations`,
        prompt: `# Role
You are the reservations specialist at ${companyName}.

# Personality
- Professional, detail-oriented, and helpful
- Always confirm dates, room type, and guest count before booking

# Context
You are receiving a transferred conversation. Review the conversation history
to understand what the guest needs — do not ask them to repeat information.

# Workflow
1. Understand the reservation request (new booking, modification, cancellation)
2. For new bookings:
   a. Ask for dates, room preference, and number of guests
   b. Check availability using checkAvailability tool
   c. Present options with pricing
   d. Confirm all details before booking
3. For modifications:
   a. Look up existing reservation
   b. Confirm changes
   c. Process modification
4. For cancellations:
   a. Look up reservation
   b. Explain cancellation policy
   c. Confirm cancellation

# Guardrails
- Never confirm availability without checking the system
- Never quote rates from memory — always use the pricing tool
- Always read the cancellation policy before processing cancellations
- Never share other guests' reservation details`,
        firstMessage:
          "Hello! I'm the reservations specialist. Let me help you with your booking.",
        transferCondition:
          "User asks about room bookings, availability, reservations, date changes, or cancellations",
        transferMessage:
          "Let me connect you with our reservations team.",
        voice: "cgSgspJ2msm6clMCkdW9",
        llm: "gpt-4o-mini",
      },
      {
        name: `${companyName} - Concierge`,
        prompt: `# Role
You are the concierge at ${companyName}, an expert on local dining, entertainment, transportation, and activities.

# Personality
- Warm, knowledgeable, and enthusiastic about recommendations
- Provide insider tips and personal touches
- Adapt formality to the guest's style

# Context
You are receiving a transferred conversation. Review history to understand the guest's interests.

# Workflow
1. Understand what the guest is looking for
2. Ask qualifying questions (cuisine preference, budget, group size, occasion)
3. Provide 2-3 personalized recommendations
4. Offer to make reservations or arrangements
5. Provide practical details (distance, hours, dress code)

# Guardrails
- Only recommend vetted, reputable establishments
- Always mention if a restaurant requires reservations
- Include allergy/dietary warnings when recommending dining
- Never guarantee availability at third-party venues without checking`,
        firstMessage:
          "Hello! I'm the concierge. I'd love to help you discover the best the area has to offer.",
        transferCondition:
          "User asks about local recommendations, restaurants, transportation, activities, or entertainment",
        transferMessage:
          "Let me connect you with our concierge.",
        voice: "EXAVITQu4vr4xnSDxMaL",
        llm: "gpt-4o-mini",
      },
      {
        name: `${companyName} - Guest Services`,
        prompt: `# Role
You are the guest services manager at ${companyName}, handling room issues, maintenance, amenities, complaints, and billing questions.

# Personality
- Empathetic, solution-oriented, and attentive
- Take ownership of problems
- Follow up to ensure resolution

# Context
You are receiving a transferred conversation. Review history to understand the guest's issue.

# Workflow
1. Understand the issue fully
2. Apologize sincerely if there's a problem
3. Classify severity:
   - Urgent (safety, no water, no AC) → immediate action + supervisor alert
   - Standard (maintenance, housekeeping) → schedule resolution
   - Minor (extra pillows, information) → resolve immediately
4. Use appropriate tools to log and resolve
5. Set clear expectations for resolution timeline
6. Offer compensation for significant issues if authorized

# Guardrails
- Never dismiss or minimize a guest's complaint
- Never promise compensation without authorization
- Always create a service ticket for tracking
- Escalate safety issues immediately
- Never share internal staff information with guests`,
        firstMessage:
          "Hello! I'm the guest services manager. I'm here to make sure everything is perfect for your stay.",
        transferCondition:
          "User has room issues, maintenance requests, complaints, amenity requests, or billing questions",
        transferMessage:
          "Let me connect you with our guest services team.",
        voice: "cgSgspJ2msm6clMCkdW9",
        llm: "gpt-4o",
      },
    ]
  );

  console.log("Multi-agent system created:");
  console.log(`  Orchestrator ID: ${result.orchestratorId}`);
  result.specialistIds.forEach((id, i) => {
    console.log(`  Specialist ${i + 1} ID: ${id}`);
  });

  return result;
}

async function setupSupportMultiAgentSystem() {
  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  const result = await createMultiAgentSystem(
    client,
    {
      name: "Support Hub",
      prompt: `# Role
You are the first point of contact for customer support. Classify the issue and route to the right team.

# Workflow
1. Greet the customer
2. Ask what they need help with
3. Classify intent:
   - Account issues (login, password, settings) → Account Agent
   - Product issues (bugs, errors, features) → Technical Agent
   - Billing (charges, refunds, subscriptions) → Billing Agent
4. Transfer to the right agent

# Guardrails
- Maximum one clarifying question before routing
- Never attempt to resolve technical issues yourself
- If unsure, default to Technical Agent`,
      firstMessage: "Hi! Welcome to support. What can I help you with today?",
      llm: "gpt-4o-mini",
    },
    [
      {
        name: "Account Support",
        prompt: `# Role
You help customers with account-related issues: login problems, password resets, profile updates, and access management.

# Workflow
1. Verify customer identity. This step is important.
2. Diagnose the account issue
3. Walk through the resolution step by step
4. Confirm the issue is resolved

# Guardrails
- Always verify identity before making account changes
- Never share account details without verification
- Never reset passwords without sending confirmation email`,
        firstMessage:
          "I can help with your account. First, could you verify your email address?",
        transferCondition:
          "User has login issues, password problems, account settings, or access questions",
        transferMessage:
          "I'll connect you with our account specialist.",
        llm: "gpt-4o-mini",
      },
      {
        name: "Technical Support",
        prompt: `# Role
You are a technical support engineer. Diagnose and resolve product issues methodically.

# Workflow
1. Understand the issue: what happened, what was expected, when it started
2. Check known issues database
3. Walk through troubleshooting steps one at a time
4. Verify each step before moving to the next
5. If unresolved after 3 attempts, create a ticket and escalate

# Guardrails
- Never ask the customer to do anything that could cause data loss
- Never blame the customer
- Always create a ticket for unresolved issues`,
        firstMessage:
          "I'm here to help with your technical issue. Can you describe what's happening?",
        transferCondition:
          "User reports bugs, errors, technical problems, or feature questions",
        transferMessage:
          "Let me connect you with our technical team.",
        llm: "gpt-4o",
      },
      {
        name: "Billing Support",
        prompt: `# Role
You handle billing inquiries: charges, refunds, subscription management, and payment issues.

# Workflow
1. Verify customer identity. This step is important.
2. Look up their billing history
3. Address their concern with specific details from the system
4. Process any authorized actions (refunds, plan changes)
5. Confirm changes and provide reference number

# Guardrails
- Always verify identity before accessing billing data
- Never process refunds over $500 without supervisor approval
- Always explain charges before processing refunds
- Provide confirmation/reference numbers for all transactions`,
        firstMessage:
          "I can help with your billing question. Let me verify your account first.",
        transferCondition:
          "User asks about charges, refunds, subscriptions, payments, or invoices",
        transferMessage:
          "I'll connect you with our billing team.",
        llm: "gpt-4o-mini",
      },
    ]
  );

  console.log("Support multi-agent system created:");
  console.log(`  Hub ID: ${result.orchestratorId}`);
  console.log(`  Specialist IDs: ${result.specialistIds.join(", ")}`);
}

if (require.main === module) {
  const scenario = process.argv[2] || "hotel";
  if (scenario === "hotel") {
    setupHotelMultiAgentSystem().catch(console.error);
  } else if (scenario === "support") {
    setupSupportMultiAgentSystem().catch(console.error);
  } else {
    console.log("Usage: npx ts-node multi-agent-system.ts [hotel|support]");
  }
}
