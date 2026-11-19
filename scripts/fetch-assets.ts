// Downloads the CC0 Poly Haven assets used by the 3D previz into
// public/assets/polyhaven/ (gitignored) and records them in LICENSES.md.
//
//   npm run assets            downloads anything missing
//   npm run assets -- --force re-downloads everything
//
// Poly Haven assets are CC0: free for commercial use, no attribution needed.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { PUBLIC_DIR, rel, run, runMain, ScriptError } from "./lib/common";

const API = "https://api.polyhaven.com";
const USER_AGENT = "domo-reels-asset-fetch";
const OUT = path.join(PUBLIC_DIR, "assets", "polyhaven");
// Backdrop derived from the tonemapped sky JPG (file name read by the previz).
const SKY_BACKDROP = "sky_8k.jpg";
const SKY_WIDTH = 8192;

type Hdri = { kind: "hdri"; id: string; res: string; tonemapped?: boolean };
type Texture = { kind: "texture"; id: string; res: string };
type Model = { kind: "model"; id: string; res: string };
type Asset = Hdri | Texture | Model;

export const ASSETS: Asset[] = [
  // Outdoor sky: HDR for lighting/reflections, tonemapped JPG for the backdrop.
  { kind: "hdri", id: "kloofendal_48d_partly_cloudy_puresky", res: "2k", tonemapped: true },
  // Workshop reflections.
  { kind: "hdri", id: "autoshop_01", res: "2k" },
  { kind: "texture", id: "asphalt_02", res: "2k" },
  { kind: "texture", id: "concrete_floor_02", res: "2k" },
  { kind: "texture", id: "white_plaster_02", res: "2k" },
  { kind: "texture", id: "clay_roof_tiles", res: "2k" },
  { kind: "model", id: "potted_plant_01", res: "1k" },
  { kind: "model", id: "potted_plant_02", res: "1k" },
  { kind: "model", id: "shrub_01", res: "1k" },
  { kind: "model", id: "shrub_02", res: "1k" },
  { kind: "model", id: "metal_tool_chest", res: "1k" },
  { kind: "model", id: "tool_cart", res: "1k" },
  { kind: "model", id: "tire_pump", res: "1k" },
];

const fileRef = z.object({ url: z.string().url(), size: z.number() });
const filesSchema = z.record(z.string(), z.unknown());
// Texture map names in the API, in order of preference.
const TEXTURE_MAPS: Record<string, string[]> = {
  diff: ["Diffuse", "diff"],
  nor: ["nor_gl"],
  rough: ["Rough", "rough"],
};

const getJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new ScriptError(`${url} -> HTTP ${res.status}`);
  }
  return res.json();
};

const download = async (
  url: string,
  dest: string,
  force: boolean,
): Promise<number> => {
  if (!force && existsSync(dest)) {
    return 0;
  }
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new ScriptError(`${url} -> HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  return buf.length;
};

const pick = (files: Record<string, unknown>, keys: string[]) =>
  keys.map((k) => files[k]).find((v) => v !== undefined) as
    | Record<string, Record<string, unknown>>
    | undefined;

const fetchAsset = async (asset: Asset, force: boolean): Promise<number> => {
  const files = filesSchema.parse(await getJson(`${API}/files/${asset.id}`));
  const dir = path.join(OUT, asset.id);
  let bytes = 0;

  if (asset.kind === "hdri") {
    const hdri = files.hdri as Record<string, Record<string, unknown>>;
    const hdr = fileRef.parse(hdri[asset.res].hdr);
    bytes += await download(hdr.url, path.join(dir, `${asset.id}_${asset.res}.hdr`), force);
    if (asset.tonemapped) {
      const jpg = fileRef.parse(files.tonemapped);
      const full = path.join(dir, `${asset.id}_tonemapped.jpg`);
      bytes += await download(jpg.url, full, force);
      // The previz backdrop: same 8K image, re-encoded much smaller.
      const sky = path.join(dir, SKY_BACKDROP);
      if (force || !existsSync(sky)) {
        const { code } = await run("ffmpeg", ["-v", "error", "-y", "-i", full, "-vf", `scale=${SKY_WIDTH}:-2:flags=lanczos`, "-q:v", "3", sky]);
        if (code !== 0) {
          throw new ScriptError(`ffmpeg failed to make ${rel(sky)}`);
        }
      }
    }
  } else if (asset.kind === "texture") {
    for (const [name, keys] of Object.entries(TEXTURE_MAPS)) {
      const map = pick(files, keys);
      if (!map) {
        throw new ScriptError(`${asset.id}: no ${name} map`);
      }
      const jpg = fileRef.parse(map[asset.res].jpg);
      bytes += await download(jpg.url, path.join(dir, `${asset.id}_${name}_${asset.res}.jpg`), force);
    }
  } else {
    const gltf = (files.gltf as Record<string, Record<string, unknown>>)[asset.res].gltf as {
      url: string;
      include?: Record<string, { url: string }>;
    };
    bytes += await download(gltf.url, path.join(dir, `${asset.id}_${asset.res}.gltf`), force);
    for (const [relPath, inc] of Object.entries(gltf.include ?? {})) {
      bytes += await download(inc.url, path.join(dir, relPath), force);
    }
  }
  return bytes;
};

const licenses = (): string =>
  [
    "# Poly Haven assets",
    "",
    "Downloaded by `npm run assets` from https://polyhaven.com.",
    "License: CC0 1.0 (public domain). Commercial use allowed, no attribution required.",
    "",
    "| Asset | Type | Resolution | Source |",
    "|---|---|---|---|",
    ...ASSETS.map(
      (a) =>
        `| ${a.id} | ${a.kind} | ${a.res} | https://polyhaven.com/a/${a.id} |`,
    ),
    "",
  ].join("\n");

const main = async () => {
  const { values } = parseArgs({
    options: { force: { type: "boolean", default: false } },
  });
  let total = 0;
  for (const asset of ASSETS) {
    const bytes = await fetchAsset(asset, values.force);
    total += bytes;
    console.log(
      `${asset.kind.padEnd(7)} ${asset.id}${bytes ? ` (${(bytes / 1e6).toFixed(1)} MB)` : " (cached)"}`,
    );
  }
  writeFileSync(path.join(OUT, "LICENSES.md"), licenses());
  console.log(`Downloaded ${(total / 1e6).toFixed(1)} MB into ${rel(OUT)}`);
};

runMain(main);
