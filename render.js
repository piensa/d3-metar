import * as d3 from "d3";
import { metar } from "./app";


const projection = d3.geoAlbers().scale(1000);
const path = d3.geoPath().projection(projection);
const priority = 2;
const width = 960;
const height = 500;

const svgContainer = d3.select("body").append("svg")
                        .attr("width", width)
                        .attr("height", height);

const barbGroup = svgContainer.append("g").attr("class", "wind-barbs");

const geojsonUrl = "https://geojson-ldxdcwirxw.now.sh/metar-api-sample-json-10945.json";
metar.stations(geojsonUrl).then(stations => {
    metar.barbs(stations, barbGroup, projection, 2);
});

// metar.test(barbGroup);
