import { useCallback, useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

interface MapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 };
const DEFAULT_ZOOM = 15;

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
};

function MapInner({ latitude, longitude, onMapClick }: MapPreviewProps) {
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    },
    [onMapClick],
  );

  const center =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : DEFAULT_CENTER;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={DEFAULT_ZOOM}
      options={MAP_OPTIONS}
      onClick={handleMapClick}
    >
      {latitude !== null && longitude !== null && (
        <Marker position={{ lat: latitude, lng: longitude }} />
      )}
    </GoogleMap>
  );
}

export function MapPreview(props: MapPreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google?.maps) {
        setIsLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 200);
      }
    };
    checkGoogleMaps();
  }, []);

  if (
    !GOOGLE_MAPS_API_KEY ||
    GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE"
  ) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-secondary text-tertiary ${props.className ?? ""}`}
      >
        <p className="text-sm">Configure a chave do Google Maps no .env</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-secondary ${props.className ?? ""}`}
      >
        <div className="size-6 animate-spin rounded-full border-2 border-brand-solid border-t-transparent" />
      </div>
    );
  }

  return <MapInner {...props} />;
}
