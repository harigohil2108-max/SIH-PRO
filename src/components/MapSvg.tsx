import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MapMode = "markers" | "heatmap" | "clusters";

interface FixedLocation {
  id: string;
  name: string;
  department: string;
  latitude: number;
  longitude: number;
}

interface Props {
  mode?: MapMode;
  height?: number;
  showControls?: boolean;
  showLocationPicker?: boolean;
  allowMapClick?: boolean;

  location?: {
    latitude?: number | null;
    longitude?: number | null;
  };

  onLocationChange?: (
    longitude: number,
    latitude: number
  ) => void;

  selectedZone?: string | null;
  onZoneClick?: (zone: string) => void;

  fixedLocations?: {
  id: string;
  name: string;
  department: string;
  latitude: number;
  longitude: number;
}[];
}

const CENTER: [number, number] = [81.6296, 21.2514];

const MAPTILER_KEY =
  (import.meta as any).env?.VITE_MAPTILER_API_KEY;

const complaints = [
  [81.625, 21.254, "Critical", "NV-1084", "Water Supply"],
  [81.632, 21.248, "Critical", "NV-1079", "Electricity"],
  [81.638, 21.252, "High", "NV-1072", "Sanitation"],
  [81.644, 21.245, "High", "NV-1065", "Roads"],
  [81.635, 21.239, "Medium", "NV-1058", "Street Lighting"],
  [81.617, 21.253, "Medium", "NV-1051", "Roads"],
  [81.641, 21.261, "Low", "NV-1044", "Water Supply"],
  [81.651, 21.255, "High", "NV-1039", "Roads"],
  [81.621, 21.241, "Critical", "NV-1033", "Water Supply"],
  [81.648, 21.237, "Medium", "NV-1028", "Electricity"],
] as const;

const FIXED_LOCATIONS: FixedLocation[] = [
  {
    id: "roads-office",
    name: "Roads Department Office",
    department: "Roads",
    latitude: 21.2518,
    longitude: 81.6290,
  },
  {
    id: "water-office",
    name: "Water Supply Department Office",
    department: "Water Supply",
    latitude: 21.2552,
    longitude: 81.6350,
  },
  {
    id: "electricity-office",
    name: "Electricity Department Office",
    department: "Electricity",
    latitude: 21.2475,
    longitude: 81.6225,
  },
  {
    id: "sanitation-office",
    name: "Sanitation Department Office",
    department: "Sanitation",
    latitude: 21.2580,
    longitude: 81.6420,
  },
  {
    id: "waste-office",
    name: "Waste Management Office",
    department: "Waste Mgmt",
    latitude: 21.2435,
    longitude: 81.6370,
  },
  {
    id: "lighting-office",
    name: "Street Lighting Office",
    department: "Street Lighting",
    latitude: 21.2600,
    longitude: 81.6250,
  },
  {
    id: "transport-office",
    name: "Transport Department Office",
    department: "Transport",
    latitude: 21.2450,
    longitude: 81.6480,
  },
];

/*
 * Keep this untyped.
 * This avoids GeoJSON namespace/type errors.
 */
const complaintGeoJson = {
  type: "FeatureCollection",
  features: complaints.map(
    ([longitude, latitude, priority, id, category]) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      properties: {
        priority,
        id,
        category,
      },
    })
  ),
};

function createMapStyle() {
  const key = encodeURIComponent(
    MAPTILER_KEY || ""
  );

  return {
    version: 8 as const,

    sources: {
      outdoor: {
        type: "raster" as const,

        tiles: [
          `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
        ],

        tileSize: 256,

        attribution:
          "© MapTiler © OpenStreetMap contributors",
      },
    },

    layers: [
      {
        id: "outdoor",
        type: "raster" as const,
        source: "outdoor",
      },
    ],
  };
}

export default function MapSvg({
  mode = "markers",
  height = 420,
  showControls = true,
  showLocationPicker = false,
  allowMapClick = true,
  location,
  onLocationChange,
  fixedLocations = [],
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  const markerRef =
    useRef<maplibregl.Marker | null>(null);

  const callbackRef =
    useRef(onLocationChange);

  callbackRef.current =
    onLocationChange;

  /*
   * =========================================================
   * CREATE MAP
   * =========================================================
   */

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!MAPTILER_KEY) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(),
      center: CENTER,
      zoom: 13,
    });

    mapRef.current = map;

    /*
     * Navigation controls
     */

    if (showControls) {
      map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
      );
    }

    /*
     * Geolocation control
     */

    if (
      showControls &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: false,
        }),
        "top-right"
      );
    }

    /*
     * =======================================================
     * MAP LOAD
     * =======================================================
     */

    map.on("load", () => {

            // =======================================================
      // FIXED DEPARTMENT OFFICE MARKERS
      // =======================================================

      fixedLocations.forEach((office) => {
        const el = document.createElement("div");

        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#0f2b4e";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        const popup = new maplibregl.Popup({
          offset: 14,
        }).setHTML(`
          <div style="font-family: Arial, sans-serif;">
            <strong>${office.name}</strong>
            <div style="margin-top:4px; color:#64748b;">
              ${office.department}
            </div>
          </div>
        `);

        new maplibregl.Marker({
          element: el,
        })
          .setLngLat([
            office.longitude,
            office.latitude,
          ])
          .setPopup(popup)
          .addTo(map);
      });
      /*
       * Add complaint source
       */

      map.addSource("complaints", {
        type: "geojson",
        data: complaintGeoJson as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 44,
      });

      /*
       * =====================================================
       * HEATMAP
       * =====================================================
       */

      map.addLayer({
        id: "complaint-heat",
        type: "heatmap",
        source: "complaints",

        maxzoom: 16,

        paint: {
          "heatmap-weight": [
            "match",
            ["get", "priority"],
            "Critical",
            1,
            "High",
            0.75,
            "Medium",
            0.5,
            0.25,
          ],

          "heatmap-intensity": 1.2,

          "heatmap-radius": 34,

          "heatmap-opacity": 0.72,

          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],

            0,
            "rgba(34,197,94,0)",

            0.35,
            "#facc15",

            0.65,
            "#f97316",

            1,
            "#dc2626",
          ],
        },
      });

      /*
       * =====================================================
       * CLUSTERS
       * =====================================================
       */

      map.addLayer({
        id: "complaint-clusters",
        type: "circle",
        source: "complaints",

        filter: ["has", "point_count"],

        paint: {
          "circle-color": "#dc2626",

          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            50,
            27,
            100,
            34,
          ],

          "circle-stroke-color": "#ffffff",

          "circle-stroke-width": 2,
        },
      });

      /*
       * Cluster count
       */

      map.addLayer({
        id: "complaint-cluster-count",
        type: "symbol",
        source: "complaints",

        filter: ["has", "point_count"],

        layout: {
          "text-field":
            "{point_count_abbreviated}",

          "text-size": 12,
        },

        paint: {
          "text-color": "#ffffff",
        },
      });

      /*
       * =====================================================
       * INDIVIDUAL POINTS
       * =====================================================
       */

      map.addLayer({
        id: "complaint-points",
        type: "circle",
        source: "complaints",

        filter: [
          "!",
          ["has", "point_count"],
        ],

        paint: {
          "circle-color": [
            "match",
            ["get", "priority"],

            "Critical",
            "#dc2626",

            "High",
            "#f59e0b",

            "Medium",
            "#2563eb",

            "#16a34a",
          ],

          "circle-radius": 7,

          "circle-stroke-color": "#ffffff",

          "circle-stroke-width": 2,
        },
      });

      /*
       * =====================================================
       * INITIAL VISIBILITY
       * =====================================================
       */

      map.setLayoutProperty(
        "complaint-points",
        "visibility",
        mode === "markers"
          ? "visible"
          : "none"
      );

      map.setLayoutProperty(
        "complaint-clusters",
        "visibility",
        mode === "clusters"
          ? "visible"
          : "none"
      );

      map.setLayoutProperty(
        "complaint-cluster-count",
        "visibility",
        mode === "clusters"
          ? "visible"
          : "none"
      );

      map.setLayoutProperty(
        "complaint-heat",
        "visibility",
        mode === "heatmap"
          ? "visible"
          : "none"
      );

      /*
       * =====================================================
       * LOCATION PICKER CLICK
       * =====================================================
       */

      map.on("click", (event: MapMouseEvent) => {
        if (
          !showLocationPicker ||
          !allowMapClick
        ) {
          return;
        }

        const longitude =
          event.lngLat.lng;

        const latitude =
          event.lngLat.lat;

        markerRef.current?.setLngLat([
          longitude,
          latitude,
        ]);

        callbackRef.current?.(
          longitude,
          latitude
        );
      });

      /*
       * =====================================================
       * CLUSTER CLICK
       * =====================================================
       */

      map.on("click","complaint-clusters", (event: MapMouseEvent) => {
          const features =
            map.queryRenderedFeatures(
              event.point,
              {
                layers: [
                  "complaint-clusters",
                ],
              }
            );

          if (!features.length) {
            return;
          }

          const feature =
            features[0];

          const clusterId =
            feature.properties?.cluster_id;

          if (
            clusterId === undefined
          ) {
            return;
          }

          const source =
            map.getSource(
              "complaints"
            ) as any;

          if (!source) {
            return;
          }

          /*
           * MapLibre versions differ in how
           * getClusterExpansionZoom is typed.
           * Using the callback form avoids the
           * Promise/type conflict.
           */

          source.getClusterExpansionZoom(
            Number(clusterId),
            (
              error: unknown,
              zoom: number
            ) => {
              if (error) {
                console.error(
                  "Cluster zoom error:",
                  error
                );
                return;
              }

              if (
                feature.geometry.type !==
                "Point"
              ) {
                return;
              }

              const coordinates =
                feature.geometry
                  .coordinates;

              map.easeTo({
                center: [
                  Number(
                    coordinates[0]
                  ),
                  Number(
                    coordinates[1]
                  ),
                ],

                zoom,
              });
            }
          );
        }
      );
    });

    /*
     * =======================================================
     * CLEANUP
     * =======================================================
     */

    return () => {
      markerRef.current?.remove();

      markerRef.current = null;

      map.remove();

      mapRef.current = null;
    };
  }, [
    showControls,
    showLocationPicker,
    allowMapClick,
  ]);

  /*
   * =========================================================
   * CHANGE MODE
   * =========================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    if (map.getLayer("complaint-points")) {
      map.setLayoutProperty(
        "complaint-points",
        "visibility",
        mode === "markers"
          ? "visible"
          : "none"
      );
    }

    if (
      map.getLayer(
        "complaint-clusters"
      )
    ) {
      map.setLayoutProperty(
        "complaint-clusters",
        "visibility",
        mode === "clusters"
          ? "visible"
          : "none"
      );
    }

    if (
      map.getLayer(
        "complaint-cluster-count"
      )
    ) {
      map.setLayoutProperty(
        "complaint-cluster-count",
        "visibility",
        mode === "clusters"
          ? "visible"
          : "none"
      );
    }

    if (
      map.getLayer("complaint-heat")
    ) {
      map.setLayoutProperty(
        "complaint-heat",
        "visibility",
        mode === "heatmap"
          ? "visible"
          : "none"
      );
    }
  }, [mode]);

  /*
   * =========================================================
   * LOCATION MARKER
   * =========================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !showLocationPicker
    ) {
      markerRef.current?.remove();

      markerRef.current = null;

      return;
    }

    const longitude =
      location?.longitude ??
      CENTER[0];

    const latitude =
      location?.latitude ??
      CENTER[1];

    /*
     * Remove old marker
     */

    markerRef.current?.remove();

    /*
     * Create marker
     */

    const marker =
      new maplibregl.Marker({
        color: "#2563eb",
        draggable: true,
      })
        .setLngLat([
          longitude,
          latitude,
        ])
        .addTo(map);

    markerRef.current = marker;

    /*
     * Drag marker
     */

    marker.on("dragend", () => {
      const position =
        marker.getLngLat();

      callbackRef.current?.(
        position.lng,
        position.lat
      );
    });

    return () => {
      marker.remove();

      if (
        markerRef.current ===
        marker
      ) {
        markerRef.current = null;
      }
    };
  }, [
    showLocationPicker,
  ]);

  /*
   * =========================================================
   * UPDATE LOCATION
   * =========================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    const longitude =
      location?.longitude;

    const latitude =
      location?.latitude;

    if (
      !map ||
      longitude == null ||
      latitude == null
    ) {
      return;
    }

    map.easeTo({
      center: [
        longitude,
        latitude,
      ],
      duration: 700,
    });

    markerRef.current?.setLngLat([
      longitude,
      latitude,
    ]);
  }, [
    location?.latitude,
    location?.longitude,
  ]);

  /*
   * =========================================================
   * NO MAPTILER KEY
   * =========================================================
   */

  if (!MAPTILER_KEY) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
        style={{ height }}
      >
        Configure VITE_MAPTILER_API_KEY
        to load the map.
      </div>
    );
  }

  /*
   * =========================================================
   * MAP
   * =========================================================
   */

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-xl border border-slate-200"
      style={{ height }}
    />
  );
}