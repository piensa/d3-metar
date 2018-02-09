import * as d3 from "d3";
import addLinesToSvg from "./app";


const projection = d3.geoAlbers().scale(1000);
const path = d3.geoPath().projection(projection);
const priority = 2.5;
const width = 960;
const height = 500;

const svgContainer = d3.select("body").append("svg")
                        .attr("width", width)
                        .attr("height", height);


d3.json("https://geojson-ldxdcwirxw.now.sh/metar-api-sample-json-10945.json", (err, data) => {
    const station = data.features.filter(f => {
        return f.properties.prior <= priority && f.properties.wdir;
    }).map(f => {
      	return {
        	"geometry": {
               "type": "Point",
               "coordinates": f.geometry.coordinates
           	},
          	"properties": f.properties,
          	"type": f.type
        }
    });
    ready(svgContainer, path, station, projection);
});

function ready(svg, path, data, projection) {

    const Group = svg
        .selectAll(".wind-barbs")
        .data(data)
        .enter()
        .append("g")
        .attr("class", d =>  `wspd-${d.properties.wspd}`)
        .attr("transform", d => {
              return `translate(${projection(d.geometry.coordinates)})
        			rotate(${d.properties.wdir}) scale(0.2)`;
           	});

    addLinesToSvg(Group)
}
