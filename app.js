import * as d3 from "d3";

const metar = {
    barbs: barbs,
    stations: getStations,
    renderWindBarbs: renderWindBarbs
};

export { metar }

function getStations(geojsonUrl, priority = 2) {
    return new Promise(function(resolve, reject) {

        d3.json(geojsonUrl, (err, data) => {
            if(err){
                reject(Error(err));
            }

            const stations = data.features.filter(f => {
                return f.properties.prior <= priority && f.properties.wdir;
            });
            resolve(stations);
        });
    });
}

function barbs(stations, barbGroup, projection, path) {
    const Group = barbGroup
        .selectAll("wind-barbs")
        .data(stations).enter()
        .append("g")
        .attr("class", d =>  `wspd-${d.properties.wspd}`)
        .attr("transform", d => {
            return `translate(${projection(d.geometry.coordinates)})
                scale(0.2) rotate(${d.properties.wdir})`;
        });

    renderWindBarbs(Group);
}

function renderLines(wspd = 25){
    const numberFlags = Math.floor(wspd/50);
    if(numberFlags >= 1){
        wspd = wspd - numberFlags * 50;
    }

    const numberFlippers = Math.floor(wspd/10);
    const hasHalfFlippers = wspd % 10 >= 5 ? true : false;

    const paddingLeft = 20;
    return addLinesToSvg({paddingLeft, numberFlippers, hasHalfFlippers, numberFlags });
}

function renderWindBarbs(container) {

    const circleData = createCircleData(20, 10, [
    	{ "cx": 0, "cy": 145, "r": 16, "fill": "none" }
    ]);
    addCircles(container, circleData);

    container.selectAll("line")
        .data(d => renderLines(d.properties.wspd) )
        .enter()
        .append("line")
        .attr("x1", d => d.x1)
        .attr("x2", d => d.x2)
        .attr("y1", d => d.y1)
        .attr("y2", d => d.y2)
        .attr("stroke", d => d.stroke)
        .style("stroke-width", d => d.strokeWidth);
}

function addLinesToSvg(newProp){

    const prop = {
            baseLenght: 100,    paddingTop: 0,
            paddingLeft: 5,     width: 40,
            numberFlippers: 3,  flipperPadding: 15,
            numberFlags: 0,     hasHalfFlippers: true
    };
    if(newProp){
        Object.assign(prop, prop, newProp);
    }

    const data = [];
    if (prop.numberFlippers > 0 || prop.hasHalfFlippers) {
        const windBarbBase = createline({ "x1": prop.paddingLeft, "x2": prop.paddingLeft,
                                   	"y1": prop.baseLenght + prop.width + prop.paddingTop,
                                    "y2": prop.width + prop.paddingTop });
        data.push(windBarbBase);
    }


    let fliPadding = prop.paddingTop;

    if(prop.numberFlags > 0){
        fliPadding = prop.paddingTop + prop.numberFlags * prop.flipperPadding;
    }

    for(let i = 0; i < prop.numberFlippers; i++){
     	let flipper = createline({ "x1": prop.paddingLeft, "x2": prop.paddingLeft + prop.width,
                                  "y1": prop.width + fliPadding, "y2": fliPadding });
       	fliPadding = fliPadding + prop.flipperPadding;
       	data.push(flipper);
    }

    if(prop.hasHalfFlippers){
       	fliPadding = prop.numberFlippers === 0 ? prop.paddingTop + prop.flipperPadding : fliPadding;
     	let flipper = createline({ "x1": prop.paddingLeft, "x2": prop.paddingLeft + prop.width/2,
                                  "y1": prop.width + fliPadding, "y2": fliPadding + prop.width/2 });
        data.push(flipper);
    }

    return data;
  }

function createline(l){
      return {
              "x1": l.x1 || 0, "x2": l.x2 || 0, "y1": l.y1 || 0, "y2": l.y2 || 0,
              "stroke": l.stroke || "#555555",
              "strokeWidth": l.strokeWidth || 4
      }
}

function createCircleData(paddinLeft = 0, paddingTop = 0, circleData){
  	return circleData.map(c => {
    	return {
          "cx": c.cx + paddinLeft || 0,
          "cy": c.cy + paddingTop || 0,
          "r": c.r || 0,
          "fill": c.fill || "none",
          "stroke": c.stroke || "#555555",
          "strokeWidth": c.strokeWidth || 4
        }
    });
}


//Add circles to the circleGroup
function addCircles(svgContainer, circleData){

    svgContainer.append("g")
            .selectAll("circle")
            .data(circleData)
            .enter()
            .append("circle")
// const circleAttributes = circles
            .attr("cx", d => d.cx)
            .attr("cy", d => d.cy)
            .attr("r", d => d.r)
            .attr("stroke", d => d.stroke)
            .style("stroke-width", d => d.strokeWidth)
            .style("fill", d => d.fill);
}


function addPoligonToSvg(container){
	const flagData = [{ points: "100,5,135,5,100,45", stroke: "#555555", strokeWidth: 4}];
  	container.selectAll("polygon")
      .data(flagData)
      .enter()
      .append("polygon")
      .attr("points", d => d.points)
      .attr("stroke", d => d.stroke)
      .style("fill", d => d.stroke)
      .style("stroke-width", d => d.strokeWidth);
}
