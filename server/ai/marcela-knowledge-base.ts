import { createKBDocumentFromText, deleteKBDocument, getConvaiAgent, updateConvaiAgent } from "../integrations/elevenlabs";
import { storage } from "../storage";
import { logger } from "../logger";
import fs from "fs/promises";
import path from "path";

export interface KBSource {
  id: string;
  name: string;
  category: "Static Reference" | "Live Data" | "Research";
  size?: number;
}

export async function getKBSources(): Promise<KBSource[]> {
  const sources: KBSource[] = [];
  
  // Static Reference files from server/ai/kb/
  try {
    const kbDir = path.join(process.cwd(), "server/ai/kb");
    const files = await fs.readdir(kbDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const stats = await fs.stat(path.join(kbDir, file));
        sources.push({
          id: file,
          name: file.replace(/^\d+-/, "").replace(".md", "").split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
          category: "Static Reference",
          size: stats.size
        });
      }
    }
  } catch (err) {
    logger.error(`Failed to list KB files: ${err}`, "marcela-kb");
  }

  // Live Data sources (roles/permissions only — financial data is not included in Marcela's KB)
  sources.push({ id: "live-roles", name: "User Roles and Permissions", category: "Live Data" });

  return sources.sort((a, b) => a.id.localeCompare(b.id));
}

function getLiveRolesDocument(): string {
  return `User Roles and Permissions

There are four user roles in the portal:

Admin — Full access to everything. Can manage users, configure settings, edit any property, access verification, and manage the AI agent. Ricardo Cidale is the sole admin.

Partner — Can view the full portfolio, edit property assumptions, run scenarios, and use analysis tools. Partners are the primary users of the financial model.

Investor — Read-only access to the portfolio and financial statements. Investors can see the numbers but cannot change assumptions.

Checker — A specialized role focused on verification and audit. Checkers can access the independent audit system and review calculation integrity. They have a dedicated Checker Manual with formula documentation.`;
}

export async function buildKnowledgeDocument(selectedSourceIds?: string[]): Promise<string> {
  const sections: string[] = [];
  const kbDir = path.join(process.cwd(), "server/ai/kb");

  try {
    const files = (await fs.readdir(kbDir)).sort();
    for (const file of files) {
      if (file.endsWith(".md")) {
        if (!selectedSourceIds || selectedSourceIds.includes(file)) {
          const content = await fs.readFile(path.join(kbDir, file), "utf-8");
          sections.push(content);
        }
      }
    }
  } catch (err) {
    logger.error(`Failed to read KB files: ${err}`, "marcela-kb");
  }

  // Live data sections (roles only — financial data decoupled from Marcela)
  if (!selectedSourceIds || selectedSourceIds.includes("live-roles")) {
    sections.push(getLiveRolesDocument());
  }

  return sections.join("\n\n---\n\n");
}

export async function getKnowledgeDocumentPreview(): Promise<{ preview: string; sections: number; characters: number }> {
  const doc = await buildKnowledgeDocument();
  return {
    preview: doc.slice(0, 500) + (doc.length > 500 ? "..." : ""),
    sections: doc.split("\n\n---\n\n").length,
    characters: doc.length,
  };
}

export async function uploadKnowledgeBase(selectedSourceIds?: string[]): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const ga = await storage.getGlobalAssumptions();
    if (!ga?.marcelaAgentId) return { success: false, error: "Marcela agent not configured" };

    const kbText = await buildKnowledgeDocument(selectedSourceIds);
    const docName = `HBG Knowledge Base ${new Date().toISOString().split("T")[0]}`;
    
    logger.info(`Compiling KB for ${docName} (${kbText.length} chars)...`, "marcela-kb");
    
    const doc = await createKBDocumentFromText(docName, kbText);
    
    // Attach to agent
    const agent = await getConvaiAgent(ga.marcelaAgentId);
    
    // Some agents have knowledge_base at top level, some inside prompt. Try both.
    const currentKb = (agent.conversation_config?.agent as any)?.knowledge_base 
      ?? (agent.conversation_config?.agent?.prompt as any)?.knowledge_base 
      ?? [];
      
    const useTopLevel = !!((agent.conversation_config?.agent as any)?.knowledge_base);
    
    // Remove previous auto-generated HBG docs if any
    const updatedKb = currentKb.filter((d: any) => !d.name?.startsWith("HBG Knowledge Base"));
    updatedKb.push({ type: "text", id: doc.id, name: doc.name });
    
    await updateConvaiAgent(ga.marcelaAgentId, useTopLevel 
      ? { conversation_config: { agent: { knowledge_base: updatedKb } } }
      : { conversation_config: { agent: { prompt: { knowledge_base: updatedKb } } } }
    );

    return { success: true, documentId: doc.id };
  } catch (err: any) {
    logger.error(`Failed to upload KB: ${err.message}`, "marcela-kb");
    return { success: false, error: err.message };
  }
}
