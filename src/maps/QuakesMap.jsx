import { renderToString } from "react-dom/server";
import {
  CssBaseline,
  Box,
  Link,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, LayersControl } from "react-leaflet";
import Header from "./Header";
import "./Style.css";
import { BASE_LAYERS } from "./baseLayers";

const OUTER_BOUNDS = [
  [-80, -180],
  [80, 180],
];

const BASE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/";

function getMarkerRadius(magnitude) {
  const baseArea = 10;
  const scaleFactor = 2.5;
  const area = baseArea * Math.pow(10, (magnitude - 1) / scaleFactor);

  return Math.sqrt(area / Math.PI);
}

const pointToLayer = ({ properties }, latlng) => {
  const radius = getMarkerRadius(properties.mag);
  return L.circleMarker(latlng, { radius: radius, color: "#ea3891" });
};

const onEachFeature = (feature, layer) => {
  if (feature.properties && feature.properties.place) {
    const popup = <Popup {...feature} />;

    layer.bindPopup(renderToString(popup));
  }
};

function Popup({ properties, geometry }) {
  const [lon, lat, depth] = geometry.coordinates;

  return (
    <>
      <Typography variant="h2">{properties.place}</Typography>
      <p>
        <span style={{ fontWeight: "bold" }}>MAGNITUDE</span>: {properties.mag}
        <br />
        <span style={{ fontWeight: "bold" }}>DEPTH</span>: {depth} km
        <br />
        <span style={{ fontWeight: "bold" }}>TYPE</span>: {properties.type}
        <br />
        <span style={{ fontWeight: "bold" }}>Lon/Lat</span>: {lon}, {lat}
      </p>
      <Typography variant="h3">
        <Link variant="h3" target="_blank" href={properties.url}>
          More info
        </Link>
      </Typography>
    </>
  );
}

function Map() {
  const [quakesJson, setQuakesJson] = useState([]);
  const [minMag, setMinMag] = useState("2.5");
  const [timeperiod, setTimeperiod] = useState("week");

  async function fetchQuakeData(url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Error fetching data from ${url}`);
      }
      const data = await resp.json();
      setQuakesJson(data.features);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const url = `${BASE_URL}/${minMag}_${timeperiod}.geojson`;
    fetchQuakeData(url);
  }, [minMag, timeperiod]);

  // console.log(quakesJson);

  return (
    <>
      <CssBaseline />
      <Header />

      <div className="parabar">
        <Box className="filter-group">
          <Typography variant="h6" className="filter-title">
            Select Magnitudes
          </Typography>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={minMag}
            onChange={(event, newMag) => {
              if (newMag !== null) setMinMag(newMag);
            }}
          >
            <ToggleButton value="all">ALL</ToggleButton>
            <ToggleButton value="1.0">M1.0+</ToggleButton>
            <ToggleButton value="2.5">M2.5+</ToggleButton>
            <ToggleButton value="4.5">M4.5+</ToggleButton>
            <ToggleButton value="significant">Significant</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box className="filter-group">
          <Typography variant="h6" className="filter-title">
            Select Time Period
          </Typography>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={timeperiod}
            onChange={(event, newTimeperiod) => {
              if (newTimeperiod !== null) setTimeperiod(newTimeperiod);
            }}
          >
            <ToggleButton value="hour">Last Hour</ToggleButton>
            <ToggleButton value="day">Last Day</ToggleButton>
            <ToggleButton value="week">Last Week</ToggleButton>
            <ToggleButton value="month">Last Month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </div>
      <MapContainer
        style={{ height: "100vh" }}
        center={[0, 0]}
        zoom={3}
        minZoom={2}
        maxBounds={OUTER_BOUNDS}
        maxBoundsViscosity={1}
      >
        <LayersControl position="topright">
          {BASE_LAYERS.map((baseLayer) => (
            <LayersControl.BaseLayer
              key={baseLayer.url}
              checked={baseLayer.checked}
              name={baseLayer.name}
            >
              <TileLayer
                attribution={baseLayer.attribution}
                url={baseLayer.url}
              />
            </LayersControl.BaseLayer>
          ))}

          <LayersControl.Overlay checked name="USGQ Earthquakes">
            <GeoJSON
              data={quakesJson}
              pointToLayer={pointToLayer}
              key={quakesJson.length}
              onEachFeature={onEachFeature}
            />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </>
  );
}

export default Map;
