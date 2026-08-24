import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource, type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MapMode = "markers" | "heatmap" | "clusters";

interface Props {
  mode?: MapMode;
  height?: number;
  showControls?: boolean;
  showLocationPicker?: boolean;
  allowMapClick?: boolean;
  location?: { latitude?: number; longitude?: number };
  onLocationChange?: (longitude: number, latitude: number) => void;
  selectedZone?: string | null;
  onZoneClick?: (zone: string) => void;
}

const CENTER: [number, number] = [81.6296, 21.2514];
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const complaints = [
  [81.625, 21.254, "Critical", "NV-1084", "Water Supply"], [81.632, 21.248, "Critical", "NV-1079", "Electricity"],
  [81.638, 21.252, "High", "NV-1072", "Sanitation"], [81.644, 21.245, "High", "NV-1065", "Roads"],
  [81.635, 21.239, "Medium", "NV-1058", "Street Lighting"], [81.617, 21.253, "Medium", "NV-1051", "Roads"],
  [81.641, 21.261, "Low", "NV-1044", "Water Supply"], [81.651, 21.255, "High", "NV-1039", "Roads"],
  [81.621, 21.241, "Critical", "NV-1033", "Water Supply"], [81.648, 21.237, "Medium", "NV-1028", "Electricity"],
] as const;

const complaintGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: complaints.map(([longitude, latitude, priority, id, category]) => ({
    type: "Feature", geometry: { type: "Point", coordinates: [longitude, latitude] }, properties: { priority, id, category },
  })),
};

function mapStyle() {
  const key = encodeURIComponent(MAPTILER_KEY || "");
  return {
    version: 8 as const,
    sources: {
      outdoor: {
        type: "raster" as const,
        tiles: [`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`],
        tileSize: 256,
        attribution: "© MapTiler © OpenStreetMap contributors",
      },
    },
    layers: [{ id: "outdoor", type: "raster" as const, source: "outdoor" }],
  };
}

export default function MapSvg({ mode = "markers", height = 420, showControls = true, showLocationPicker = false, allowMapClick = true, location, onLocationChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pickerRef = useRef<Marker | null>(null);
  const locationChangeRef = useRef(onLocationChange);
  locationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!containerRef.current || !MAPTILER_KEY) return;
    const map = new maplibregl.Map({ container: containerRef.current, style: mapStyle(), center: CENTER, zoom: 13, attributionControl: true });
    mapRef.current = map;
    if (showControls) map.addControl(new maplibregl.NavigationControl(), "top-right");
    if (showControls && "geolocation" in navigator) map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), "top-right");

    map.on("load", () => {
      map.addSource("complaints", { type: "geojson", data: complaintGeoJson, cluster: true, clusterMaxZoom: 14, clusterRadius: 44 });
      map.addLayer({ id: "complaint-heat", type: "heatmap", source: "complaints", maxzoom: 16, paint: {
        "heatmap-weight": ["match", ["get", "priority"], "Critical", 1, "High", 0.75, "Medium", 0.5, 0.25], "heatmap-intensity": 1.2, "heatmap-radius": 34, "heatmap-opacity": 0.72,
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(34,197,94,0)", 0.35, "#facc15", 0.65, "#f97316", 1, "#dc2626"],
      } });
      map.addLayer({ id: "complaint-clusters", type: "circle", source: "complaints", filter: ["has", "point_count"], paint: { "circle-color": "#dc2626", "circle-radius": ["step", ["get", "point_count"], 20, 50, 27, 100, 34], "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.addLayer({ id: "complaint-cluster-count", type: "symbol", source: "complaints", filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 }, paint: { "text-color": "#fff" } });
      map.addLayer({ id: "complaint-points", type: "circle", source: "complaints", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["match", ["get", "priority"], "Critical", "#dc2626", "High", "#f59e0b", "Medium", "#2563eb", "#16a34a"], "circle-radius": 7, "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.setLayoutProperty("complaint-points", "visibility", mode === "markers" ? "visible" : "none");
      map.setLayoutProperty("complaint-clusters", "visibility", mode === "clusters" ? "visible" : "none");
      map.setLayoutProperty("complaint-cluster-count", "visibility", mode === "clusters" ? "visible" : "none");
      map.setLayoutProperty("complaint-heat", "visibility", mode === "heatmap" ? "visible" : "none");
      map.on("click", (event) => {
        if (!showLocationPicker || !allowMapClick) return;
        const position: [number, number] = [event.lngLat.lng, event.lngLat.lat];
        pickerRef.current?.setLngLat(position);
        locationChangeRef.current?.(position[0], position[1]);
      });
      map.on("click", "complaint-clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["complaint-clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("complaints") as GeoJSONSource;
        if (clusterId !== undefined) source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (!error && zoom !== null) map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
      });
    });
    return () => { pickerRef.current?.remove(); pickerRef.current = null; map.remove(); mapRef.current = null; };
  }, [showControls, allowMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    map.setLayoutProperty("complaint-points", "visibility", mode === "markers" ? "visible" : "none");
    map.setLayoutProperty("complaint-clusters", "visibility", mode === "clusters" ? "visible" : "none");
    map.setLayoutProperty("complaint-cluster-count", "visibility", mode === "clusters" ? "visible" : "none");
    map.setLayoutProperty("complaint-heat", "visibility", mode === "heatmap" ? "visible" : "none");
  }, [mode]);

  useEffect(() => {
    if (!mapRef.current || !showLocationPicker) { pickerRef.current?.remove(); pickerRef.current = null; return; }
    const longitude = location?.longitude ?? CENTER[0];
    const latitude = location?.latitude ?? CENTER[1];
    pickerRef.current = new maplibregl.Marker({ color: "#2563eb", draggable: true }).setLngLat([longitude, latitude]).addTo(mapRef.current);
    pickerRef.current.on("dragend", () => {
      const position = pickerRef.current?.getLngLat();
      if (position) locationChangeRef.current?.(position.lng, position.lat);
    });
    return () => pickerRef.current?.remove();
  }, [showLocationPicker]);

  useEffect(() => {
    const map = mapRef.current;
    const longitude = location?.longitude;
    const latitude = location?.latitude;
    if (!map || longitude == null || latitude == null) return;
    map.easeTo({ center: [longitude, latitude], duration: 700 });
    pickerRef.current?.setLngLat([longitude, latitude]);
  }, [location?.latitude, location?.longitude]);

  if (!MAPTILER_KEY) return <div className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800" style={{ height }}>Configure VITE_MAPTILER_API_KEY to load the map.</div>;
  return <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200" style={{ height }} />;
}
