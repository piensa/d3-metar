import * as d3 from "d3";

const metar = {
    barbs: barbs,
    stations: getStations,
    test: test
};

export { metar }

function test(barbGroup){
    const stations = [{
       "type":"Feature",
       "properties":{
          "id":"KABR", "site":"Aberdeen Rgnl", "prior":"3",
          "obsTime":"2018-02-05T21:53:00Z", "temp":-13.3,
          "dewp":-20, "wspd":95, "wgst":24, "wdir": 100,
          "ceil":31, "cover": "SCT",
          "visib":10, "fltcat":"VFR",
          "altim":1023.8, "slp":1026.9
       },
       "geometry":{
          "type":"Point",
          "coordinates":[
             -98.42,
             45.45
          ]
       }
    }];

    const Group = barbGroup
        .selectAll("wind-barbs")
        .data(stations)
        .enter()
        .append("g")
        .attr("class", d =>  `barb wspd-${d.properties.wspd}`)

    renderWindBarbs(Group, { paddingLeft: 5, paddingTop: 35 });
}

function getStations(geojsonUrl) {
    return new Promise(function(resolve, reject) {

        d3.json(geojsonUrl, (err, data) => {
            if(err){
                reject(Error(err));
            }

            const stations = data.features.filter(f => f.properties.wdir);
            resolve(stations);
        });
    });
}

function barbs(stations, barbGroup, projection, priority = 2, path) {
    const Group = barbGroup
        .selectAll("wind-barbs")
        .data(stations.filter(f => f.properties.prior <= priority)).enter()
        .append("g")
        .attr("class", d =>  `barb wspd-${d.properties.wspd}`)
        .attr("transform", d => {
            return `translate(${projection(d.geometry.coordinates)}) scale(0.2)`;
        });

    renderWindBarbs(Group, { paddingLeft: 5, paddingTop: 35 });

}

function renderWindBarbs(container, prop) {

    addCircles(container, prop);

    addPoligonToSvg(container, prop);

    addLinesToSvg(container, prop);

    renderCloud(container, prop);
}

function renderCloud(container, prop){
    /* Sources:
        http://ww2010.atmos.uiuc.edu/(Gh)/guides/maps/sfcobs/wnd.rxml
        http://ww2010.atmos.uiuc.edu/(Gh)/guides/maps/sfcobs/cldcvr.rxml
        https://www.aviationweather.gov/taf/help?page=plot */
    const r = 30;
    const y = 35;
    const margin = prop.paddingTop;
    const cloudData = [{
        "d": `M${margin},${y} m0,${-r} l0,${r*2}`
    },{
        "d": `M${margin},${y} m0,${-r} l0,${r*2}
              M${margin},${y} v${-r} a${r},${r} 0 0,1 ${r},${r} z`
    },{
        "d": `M${margin},${y} h${-r} a${r},${r} 0 1,0 ${r},${-r} z`
    },{
        "d": `M${margin},${y} m${-r},0 a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-r*2},0`
    },{
        "d": `M${margin - r},${y} l${r*2},0 M${margin},${y + r} l0,${-2*r}`,
        "trans": `rotate(-45 ${margin} ${y})`
    },{
        "d": `M${margin},${y} m${-r/2},${-r/2} l0,${r} m0,${-r}
                l${r/2},${r*0.8} m0,0 l${r/2},${-r*0.8} m0,0 l0,${r}`
    }];

    container.selectAll("path")
            .data(d => cloudreportToSvg(d.properties.cover, cloudData))
            .enter()
            .append("path")
            .attr("d", d => d.d)
            .attr("transform", d => d.trans)
            .attr("stroke", "#555555")
            .style("stroke-width", 6)
            .style("fill", "#555555")
            .style("stroke-linecap", "round");

    function cloudreportToSvg(cover, cloudData) {
        const index = cover === "SKC" || cover === "CLR" ||
                      cover === "NSC" || cover === "CAVOK" ? null :
                      cover === "FEW" ? 0 :
                      cover === "SCT" ? 1 :
                      cover === "BKN" ? 2 :
                      cover === "OVC" ? 3 :
                      cover === "VV" || cover === "OVX" ? 4 : 5;

        return index === null ? [] : [ cloudData[index] ];
    }
}

function addLinesToSvg(container, prop) {
    container.selectAll("line")
        .data(d => renderLines(d.properties.wspd, d.properties.wdir,  prop))
        .enter()
        .append("line")
        .attr("x1", d => d.x1)
        .attr("x2", d => d.x2)
        .attr("y1", d => d.y1)
        .attr("y2", d => d.y2)
        .attr("stroke", d => d.stroke)
        .style("stroke-width", d => d.strokeWidth)
        .style("stroke-linecap", "round")
        .attr("transform", d => {
            return `rotate(${d.wdir} 35 35)`;
        });

    function renderLines(wspd = 0, wdir = 0, prop){
        // Make sure that the maximun value is 95
        if (wspd > 99) {
            wspd = 95;
        }

        const numberFlags = Math.floor(wspd/50);
        if(numberFlags >= 1){
            wspd = wspd - numberFlags * 50;
        }

        const numberFlippers = Math.floor(wspd/10);
        const hasHalfFlippers = wspd % 10 >= 5 ? true : false;
        const paddingLeft = prop.paddingLeft;
        const paddingTop = prop.paddingTop;
        return addLinesToDataArray({paddingLeft, paddingTop, numberFlippers,
            hasHalfFlippers, numberFlags, wdir });
    }

    function addLinesToDataArray(newProp){
        const prop = {
                baseLenght: 70,    paddingTop: 0,
                paddingLeft: 5,     width: 40,
                numberFlippers: 3,  flipperPadding: 15,
                numberFlags: 1,     hasHalfFlippers: true,
                wdir: 0
        };
        if(newProp){
            Object.assign(prop, prop, newProp);
        }

        const data = [];
        if (prop.numberFlippers > 0 || prop.hasHalfFlippers || prop.numberFlags > 0) {
            const windBarbBase = createline({
                "x1": prop.paddingTop*2 - 5,
                "x2": prop.paddingTop*2 + prop.baseLenght + 5,
                "y1": prop.paddingTop,
                "y2": prop.paddingTop
            });
            data.push(windBarbBase);
        }


        let fliPadding = prop.paddingLeft + prop.paddingTop*2 + prop.baseLenght;

        if(prop.numberFlags > 0){
            fliPadding = fliPadding - prop.flipperPadding;
        }

        for(let i = 0; i < prop.numberFlippers; i++){
         	let flipper = createline({
                                "x1": fliPadding,
                                "x2": fliPadding + prop.width,
                                "y1": prop.paddingTop,
                                "y2": prop.paddingTop + prop.width
                            });

           	fliPadding = fliPadding - prop.flipperPadding;
           	data.push(flipper);
        }

        if(prop.hasHalfFlippers){
           	fliPadding = prop.numberFlippers === 0 && prop.numberFlags === 0 ?
                fliPadding - prop.flipperPadding : fliPadding;
         	let flipper = createline({
                            "y1": prop.paddingTop,
                            "y2": prop.paddingTop + prop.width/2,
                            "x1": fliPadding,
                            "x2": fliPadding + prop.width/2
                        });
            data.push(flipper);
        }

        return data;

        function createline(l){
              return {
                      "x1": l.x1 || 0,
                      "x2": l.x2 || 0,
                      "y1": l.y1 || 0,
                      "y2": l.y2 || 0,
                      "stroke": l.stroke || "#555555",
                      "strokeWidth": l.strokeWidth || 6,
                      "wdir": prop.wdir

              }
        }
    }
}



function addPoligonToSvg(container, prop){
    const width = 40;
    const base = prop.paddingLeft + prop.paddingTop*2 + 70;
    const points = `${base},${prop.paddingTop},
                    ${base + width},${prop.paddingTop},
                    ${base + width}, ${prop.paddingTop + width}`;

        // const points = `${prop.paddingLeft},${prop.paddingTop}, ${prop.paddingLeft + width},
        //     ${prop.paddingTop}, ${prop.paddingLeft}, ${prop.paddingTop + width}`;

  	container.selectAll("polygon")
      .data(d => makePolygon(points, d.properties) )
      .enter()
      .append("polygon")
      .attr("points", d => d.points)
      .attr("stroke", d => d.stroke)
      .style("fill", d => d.stroke)
      .style("stroke-width", d => d.strokeWidth)
      .attr("transform", d => {
          return `rotate(${d.wdir} 35 35)`;
      });

      function makePolygon(points, properties, color = "#555555") {
          return properties.wspd >= 50 ? [{
              points: points,
              stroke: color,
              strokeWidth: 6,
              wdir: properties.wdir || 0
          }] : [];
      }
}

//Add circles
function addCircles(svgContainer, prop){
    const y = 30;
    const circleData = createCircleData(prop.paddingLeft, prop.paddingTop, [
        { "cx": 0, "cy": y, "r": 30, "fill": "none" }
    ]);

    svgContainer.selectAll("circle")
            .data(circleData)
            .enter()
            .append("circle")
            .attr("cx", d => d.cx)
            .attr("cy", d => d.cy)
            .attr("r", d => d.r)
            .attr("stroke", d => d.stroke)
            .style("stroke-width", d => d.strokeWidth)
            .style("fill", d => d.fill);

    function createCircleData(paddingLeft = 0, paddingTop = 0, circleData){
      	return circleData.map(c => {
        	return {
              "cx": c.cx + paddingTop || 0,
              "cy": c.cy + paddingLeft || 0,
              "r": c.r || 0,
              "fill": c.fill || "none",
              "stroke": c.stroke || "#555555",
              "strokeWidth": c.strokeWidth || 6
            }
        });
    }
}
