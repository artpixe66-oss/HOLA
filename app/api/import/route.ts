import { NextRequest, NextResponse } from "next/server";
import { importProspects } from "@/lib/db";
import type { ProspectInput, ProspectType, ProspectStatus } from "@/lib/types";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect separator
  const firstLine = lines[0];
  const sep = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(sep).map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

const COLUMN_ALIASES: Record<string, string> = {
  // name
  nom: "name",
  prenom: "name",
  "nom complet": "name",
  prénom: "name",
  name: "name",
  // company
  entreprise: "company",
  société: "company",
  societe: "company",
  enseigne: "company",
  company: "company",
  // type
  type: "type",
  categorie: "type",
  catégorie: "type",
  // email
  email: "email",
  "e-mail": "email",
  courriel: "email",
  mail: "email",
  // phone
  telephone: "phone",
  téléphone: "phone",
  tel: "phone",
  tél: "phone",
  phone: "phone",
  "téléphone portable": "phone",
  mobile: "phone",
  // city
  ville: "city",
  city: "city",
  commune: "city",
  localite: "city",
  localité: "city",
  // status
  statut: "status",
  status: "status",
  état: "status",
  etat: "status",
  // notes
  notes: "notes",
  note: "notes",
  commentaires: "notes",
  commentaire: "notes",
  // follow_up_date
  "relance": "follow_up_date",
  "date relance": "follow_up_date",
  "follow_up_date": "follow_up_date",
  "date de relance": "follow_up_date",
};

function normalizeType(val: string): ProspectType {
  const v = val.toLowerCase().trim();
  if (v.includes("product")) return "producteur";
  return "commerçant";
}

function normalizeStatus(val: string): ProspectStatus {
  const v = val.toLowerCase().trim();
  if (v.includes("contact") && !v.includes("à")) return "Contacté";
  if (v.includes("intéress") || v.includes("interess")) return "Intéressé";
  if (v.includes("client")) return "Client";
  if (v.includes("perdu")) return "Perdu";
  return "À contacter";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Fichier vide ou invalide" }, { status: 400 });
    }

    const prospects: ProspectInput[] = rows
      .filter((row) => Object.values(row).some((v) => v))
      .map((row) => {
        // Map columns using aliases
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          const canonical = COLUMN_ALIASES[key] || key;
          if (!mapped[canonical]) mapped[canonical] = value;
        }

        return {
          name: mapped.name || "Inconnu",
          company: mapped.company || "",
          type: mapped.type ? normalizeType(mapped.type) : "commerçant",
          email: mapped.email || "",
          phone: mapped.phone || "",
          city: mapped.city || "",
          status: mapped.status ? normalizeStatus(mapped.status) : "À contacter",
          notes: mapped.notes || "",
          follow_up_date: mapped.follow_up_date || null,
        };
      });

    const result = importProspects(prospects);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
