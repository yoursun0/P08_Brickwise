import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/server";
import { extractPriceList, getPdfPageCount } from "@/lib/extract/extractPriceList";
import { sha256Hex } from "@/lib/hash";
import { creditsForPageCount, MAX_PDF_PAGES } from "@/lib/credits";
import { ensureProfile, grantMonthlyCredits } from "@/lib/profile";
import { applyTags, legacyPricesFromNamed } from "@/lib/price";
import type { NamedPrice, Unit } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function isPdf(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || file.type === "application/pdf";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await handleAnalyze(req, params);
  } catch (err) {
    const message = err instanceof Error ? err.message : "解析過程發生未預期錯誤。";
    return NextResponse.json({ ok: false, error: "internal", message }, { status: 500 });
  }
}

async function handleAnalyze(req: Request, params: Promise<{ id: string }>) {
  const { id: projectId } = await params;
  const supabase = await getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "請先登入。" }, { status: 401 });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (!project) {
    return NextResponse.json({ error: "not_found", message: "找不到此項目。" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file", message: "請選擇一份 PDF。" }, { status: 400 });
  }
  if (!isPdf(file)) {
    return NextResponse.json({
      error: "pdf_only",
      message: "請上載價單表格 PDF。攻略圖 / 掃描檔暫不支援。",
    }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large", message: "檔案超過 20MB。" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = sha256Hex(bytes);

  let profile = await ensureProfile(supabase, user);
  profile = await grantMonthlyCredits(supabase, profile);

  let pageCount = 1;
  try {
    pageCount = await getPdfPageCount(bytes);
  } catch {
    return NextResponse.json({ error: "unreadable", message: "無法讀取 PDF。" }, { status: 400 });
  }

  if (pageCount > MAX_PDF_PAGES) {
    return NextResponse.json({
      ok: false,
      reason: "too_many_pages",
      message: `PDF 有 ${pageCount} 頁，目前上限 ${MAX_PDF_PAGES} 頁。`,
    }, { status: 400 });
  }

  const needed = creditsForPageCount(pageCount);

  const { data: cachedDocs } = await supabase
    .from("documents")
    .select("id, project_id")
    .eq("file_hash", hash)
    .eq("status", "succeeded")
    .limit(5);

  const cached = cachedDocs?.[0];
  if (cached) {
    await replaceUnitsFromCache(supabase, cached.id, cached.project_id, projectId, {
      file_name: file.name,
      page_count: pageCount,
      file_hash: hash,
    });
    return NextResponse.json({
      ok: true,
      cached: true,
      charged: 0,
      redirect: `/projects/${projectId}/results`,
    });
  }

  if (profile.credits_balance < needed) {
    return NextResponse.json({
      error: "insufficient_credits",
      needed,
      balance: profile.credits_balance,
      message: "credits 不足。每位用戶每月免費 3 credits；成功解析才扣點。",
    }, { status: 402 });
  }

  const result = await extractPriceList(bytes);

  if (!result.ok) {
    await supabase.from("documents").insert({
      project_id: projectId,
      file_name: file.name,
      file_type: "pdf",
      page_count: pageCount,
      file_hash: hash,
      status: "failed",
      error_message: result.message,
    });
    return NextResponse.json({
      ok: false,
      reason: result.reason,
      message: result.message,
    }, { status: 422 });
  }

  await supabase.from("units").delete().eq("project_id", projectId);

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      file_name: file.name,
      file_type: "pdf",
      page_count: pageCount,
      file_hash: hash,
      status: "succeeded",
      extraction_confidence: 100,
    })
    .select("id")
    .single();
  if (docErr || !doc) {
    return NextResponse.json({ error: "db", message: "無法寫入文件紀錄。" }, { status: 500 });
  }

  const drafted: Unit[] = result.units.map((u) => {
    const legacy = legacyPricesFromNamed(u.prices);
    return {
      id: randomUUID(),
      project_id: projectId,
      source_document_id: doc.id,
      tower: u.tower,
      floor_raw: u.floor_raw,
      floor_sort_key: u.floor_sort_key,
      unit_no: u.unit_no,
      layout: u.layout,
      saleable_area_sqft: u.saleable_area_sqft,
      prices: u.prices,
      price_original: legacy.price_original,
      price_plan_a: legacy.price_plan_a,
      price_plan_b: legacy.price_plan_b,
      computed_price: null,
      psf: null,
      tags: [],
      explainability: {},
      extraction_confidence: 100,
    };
  });
  const tagged = applyTags(drafted, "lowest");
  const { error: unitErr } = await supabase.from("units").insert(tagged);
  if (unitErr) {
    return NextResponse.json({ error: "db", message: "無法寫入單位資料。" }, { status: 500 });
  }

  await supabase
    .from("projects")
    .update({ price_basis: "lowest", price_columns: result.priceColumns })
    .eq("id", projectId);

  await supabase
    .from("profiles")
    .update({ credits_balance: profile.credits_balance - needed })
    .eq("id", user.id);

  return NextResponse.json({
    ok: true,
    cached: false,
    charged: needed,
    count: tagged.length,
    redirect: `/projects/${projectId}/results`,
  });
}

async function replaceUnitsFromCache(
  supabase: Awaited<ReturnType<typeof getClient>>,
  cachedDocId: string,
  cachedProjectId: string,
  targetProjectId: string,
  meta: { file_name: string; page_count: number; file_hash: string },
) {
  let { data: srcUnits } = await supabase.from("units").select("*").eq("source_document_id", cachedDocId);
  if (!srcUnits?.length) {
    const fallback = await supabase.from("units").select("*").eq("project_id", cachedProjectId);
    srcUnits = fallback.data ?? [];
  }
  const { data: srcProject } = await supabase
    .from("projects")
    .select("price_columns, price_basis")
    .eq("id", cachedProjectId)
    .single();

  await supabase.from("units").delete().eq("project_id", targetProjectId);

  const { data: doc } = await supabase
    .from("documents")
    .insert({
      project_id: targetProjectId,
      file_name: meta.file_name,
      file_type: "pdf",
      page_count: meta.page_count,
      file_hash: meta.file_hash,
      status: "succeeded",
      extraction_confidence: 100,
    })
    .select("id")
    .single();

  if (srcUnits.length && doc) {
    const copies = srcUnits.map((u) => ({
      id: randomUUID(),
      project_id: targetProjectId,
      source_document_id: doc.id,
      tower: u.tower,
      floor_raw: u.floor_raw,
      floor_sort_key: u.floor_sort_key,
      unit_no: u.unit_no,
      layout: u.layout,
      saleable_area_sqft: u.saleable_area_sqft,
      prices: (u.prices as NamedPrice[]) ?? [],
      price_original: u.price_original,
      price_plan_a: u.price_plan_a,
      price_plan_b: u.price_plan_b,
      computed_price: u.computed_price,
      psf: u.psf,
      tags: u.tags,
      explainability: u.explainability,
      extraction_confidence: u.extraction_confidence,
    }));
    await supabase.from("units").insert(copies);
  }

  await supabase
    .from("projects")
    .update({
      price_basis: srcProject?.price_basis ?? "lowest",
      price_columns: srcProject?.price_columns ?? [],
    })
    .eq("id", targetProjectId);
}
