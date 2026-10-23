"use client";
import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin, Store, Compass, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { calculateDistanceKm } from "@/lib/geoUtils";

interface DeliveryRouteMapProps {
  orderLocation: string;
  orderLatitude?: number | null;
  orderLongitude?: number | null;
  locationNotes?: string;
  storeName?: string;
  storeAddress?: string;
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  orderId?: string;
  deliveryPersonId?: string;
  isDelivering?: boolean;
}

export default function DeliveryRouteMap({
  orderLocation,
  orderLatitude,
  orderLongitude,
  locationNotes,
  storeName,
  storeAddress,
  storeLatitude,
  storeLongitude,
  orderId,
  deliveryPersonId,
  isDelivering = false,
}: DeliveryRouteMapProps) {
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);

  // Broadcast rider location to server for customer/admin live tracking
  const pushLocationToServer = async (lat: number, lng: number) => {
    if (!orderId || !deliveryPersonId || !isDelivering) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/rider-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, deliveryPersonId }),
      });
      if (res.ok) {
        setLastBroadcastTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch {
      // Background ping fails silently
    }
  };

  // Request rider's current live location
  const handleGetRiderLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported on this device.");
      return;
    }
    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRiderCoords(coords);
        setLocating(false);

        // If order coordinates exist, calculate straight-line distance
        if (orderLatitude != null && orderLongitude != null) {
          const dist = calculateDistanceKm(coords.lat, coords.lng, orderLatitude, orderLongitude);
          setDistanceKm(dist);
        }

        // Push to server if delivering
        if (isDelivering && orderId && deliveryPersonId) {
          pushLocationToServer(coords.lat, coords.lng);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setGpsError("GPS permission denied. Enable location in phone browser settings.");
        } else {
          setGpsError("Unable to acquire GPS fix. Try again outdoors.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    handleGetRiderLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderLatitude, orderLongitude, orderId]);

  // Periodic GPS push every 15s during active delivery
  useEffect(() => {
    if (!isDelivering || !orderId || !deliveryPersonId) return;

    const intervalId = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setRiderCoords(coords);
            if (orderLatitude != null && orderLongitude != null) {
              setDistanceKm(calculateDistanceKm(coords.lat, coords.lng, orderLatitude, orderLongitude));
            }
            pushLocationToServer(coords.lat, coords.lng);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isDelivering, orderId, deliveryPersonId, orderLatitude, orderLongitude]);

  // Construct Google Maps Turn-by-Turn URL
  const googleMapsUrl =
    orderLatitude != null && orderLongitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${orderLatitude},${orderLongitude}&travelmode=two_wheeler`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderLocation)}`;

  // OpenStreetMap embed URL centered on destination
  const targetLat = orderLatitude ?? (storeLatitude ?? 28.7499);
  const targetLng = orderLongitude ?? (storeLongitude ?? 77.1170);
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${targetLng - 0.008}%2C${targetLat - 0.006}%2C${targetLng + 0.008}%2C${targetLat + 0.006}&layer=mapnik&marker=${targetLat}%2C${targetLng}`;

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1.5px solid #E2E8F0", overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
      {/* Map Header */}
      <div style={{ padding: "12px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 800, color: "#1E293B" }}>
          <Compass size={15} color="#0135FB" />
          Rider Navigation Map
        </div>
        {distanceKm != null && (
          <span style={{ fontSize: "0.72rem", fontWeight: 800, background: "#EFF6FF", color: "#0135FB", padding: "2px 8px", borderRadius: 6 }}>
            📍 {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} meters away` : `${distanceKm} km away`}
          </span>
        )}
      </div>

      {/* Live GPS Broadcast Indicator */}
      {isDelivering && (
        <div style={{ padding: "6px 14px", background: "#F0FDF4", borderBottom: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.25)" }} />
            Live GPS Broadcasting to Customer
          </span>
          {lastBroadcastTime && <span style={{ color: "#15803D", fontSize: "0.68rem" }}>Synced {lastBroadcastTime}</span>}
        </div>
      )}

      {/* Embedded OpenStreetMap Preview */}
      <div style={{ position: "relative", width: "100%", height: 200, background: "#E2E8F0" }}>
        <iframe
          title="Delivery Navigation Map"
          src={osmEmbedUrl}
          style={{ width: "100%", height: "100%", border: 0 }}
          loading="lazy"
        />

        {/* Floating Destination Pin Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            right: 10,
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(4px)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.76rem",
          }}
        >
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
            <span style={{ color: "#60A5FA", fontWeight: 800 }}>Destination: </span>
            <span style={{ fontWeight: 600 }}>{orderLocation}</span>
          </div>
          {riderCoords && (
            <span style={{ color: "#4ADE80", fontWeight: 800, flexShrink: 0, fontSize: "0.7rem" }}>
              ✓ GPS Locked
            </span>
          )}
        </div>
      </div>

      {/* Navigation & Directions Info Card */}
      <div style={{ padding: 14 }}>
        {/* Route Steps Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {/* Step 1: Store Hub */}
          {storeName && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EFF6FF", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Store size={12} />
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>PICKUP POINT</div>
                <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#0F172A" }}>{storeName}</div>
                {storeAddress && <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{storeAddress}</div>}
              </div>
            </div>
          )}

          {/* Dotted connecting line */}
          <div style={{ marginLeft: 11, width: 2, height: 12, borderLeft: "2px dashed #CBD5E1" }} />

          {/* Step 2: Customer Destination */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <MapPin size={12} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>CUSTOMER DROP SPOT</div>
              <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#0F172A" }}>{orderLocation}</div>
              {locationNotes && (
                <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 700, marginTop: 2 }}>
                  ⚠️ Landmark / Gate / Hostel: {locationNotes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GPS Warning if any */}
        {gpsError && (
          <div style={{ fontSize: "0.72rem", color: "#B91C1C", background: "#FEF2F2", padding: "6px 10px", borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={13} />
            {gpsError}
            <button
              onClick={handleGetRiderLocation}
              style={{ background: "none", border: "none", color: "#0135FB", fontWeight: 800, cursor: "pointer", textDecoration: "underline", marginLeft: "auto" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Big Action: Open External Turn-by-Turn Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "13px 0",
            background: "#0135FB",
            color: "#FFFFFF",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.95rem",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(1,53,251,0.35)",
            boxSizing: "border-box",
          }}
        >
          <Navigation size={18} />
          Navigate in Google Maps
          <ExternalLink size={14} style={{ opacity: 0.8 }} />
        </a>
      </div>
    </div>
  );
}
