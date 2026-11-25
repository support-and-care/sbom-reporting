import type { NextRequest } from "next/server";
import { isSbomFormat, type SbomFormat } from "@/lib/artifact";
import { exportSbom, findArtifactVersion } from "@/lib/data/artifact";
import { loadFromDt } from "@/lib/dt/client";

/** File name safe for every platform, e.g. `maven-scm-2.2.1.cdx.json`. */
function fileName(name: string, version: string, format: SbomFormat): string {
  const base = [name, version]
    .filter(Boolean)
    .join("-")
    .replace(/[^\w.-]+/g, "_");
  return `${base}.cdx.${format}`;
}

/** Downloads the CycloneDX SBOM of a tracked artifact version. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/sbom/[uuid]">,
) {
  const { uuid } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  if (!isSbomFormat(format)) {
    return new Response("Unsupported format", { status: 400 });
  }

  const sbom = await loadFromDt(async () => {
    const version = await findArtifactVersion(uuid);
    if (!version) return null;
    return {
      response: await exportSbom(uuid, format),
      name: fileName(version.name, version.version ?? "", format),
    };
  });
  if (sbom === null) return new Response("Not found", { status: 404 });
  if (!sbom) {
    return new Response("The SBOM is unavailable right now", { status: 503 });
  }

  return new Response(sbom.response.body, {
    headers: {
      "Content-Type":
        sbom.response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sbom.name}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
