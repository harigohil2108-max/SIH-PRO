const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export interface GeocodedLocation {
  address: string;
  city: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

function requireKey() {
  if (!MAPTILER_API_KEY) {
    throw new Error("MapTiler API key is not configured.");
  }
}

function parseFeature(feature: any): GeocodedLocation {
  const [longitude, latitude] = feature.center || feature.geometry?.coordinates || [];
  const context = Array.isArray(feature.context) ? feature.context : [];

  const findContext = (...types: string[]) =>
    context.find((item: any) =>
      types.some((type) => String(item.id || "").startsWith(`${type}.`))
    )?.text || "";

  return {
    address:
      feature.place_name ||
      feature.text ||
      "Selected location",
    city:
      findContext("place", "locality", "municipality", "village", "town") ||
      (String(feature.id || "").match(/^(place|locality|municipality|village|town)\./) ? feature.text : "") ||
      findContext("subregion"),
    district: findContext("district", "subregion") || findContext("county"),
    state:
      findContext("region") ||
      (String(feature.id || "").startsWith("region.") ? feature.text : ""),
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

export async function searchAddress(query: string): Promise<GeocodedLocation[]> {
  requireKey();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const url =
    `https://api.maptiler.com/geocoding/${encodeURIComponent(trimmed)}.json` +
    `?key=${encodeURIComponent(MAPTILER_API_KEY as string)}&language=en&limit=5`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Map search failed");
  }

  return (data.features || []).map(parseFeature);
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedLocation> {
  requireKey();

  const url =
    `https://api.maptiler.com/geocoding/${longitude},${latitude}.json` +
    `?key=${encodeURIComponent(MAPTILER_API_KEY as string)}&language=en&limit=1`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !data.features?.length) {
    throw new Error(data?.message || "Could not determine the address");
  }

  return parseFeature(data.features[0]);
}
