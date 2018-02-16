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
          "dewp":-20, "wspd":65, "wgst":24, "wdir":-90,
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
        .data(stations).enter();


    const gre = Group.append("g")
        .attr("class", d =>  `barb wspd-${d.properties.wspd}`)
        .attr("transform", d => {
            return `rotate(${90 + d.properties.wdir} 35 155)`;
        });

    const cloud = Group.append("g")
        .attr("class", d =>  `cloud cover-${d.properties.cover}`);

    renderWindBarbs(gre, { paddingLeft: 35, paddingTop: 5 });
    renderCloud(cloud, { paddingLeft: 35, paddingTop: 5 });
}

function getStations(geojsonUrl) {
    return new Promise(function(resolve, reject) {

        d3.json(geojsonUrl, (err, data) => {
            if(err){
                reject(Error(err));
            }

            const stations = data.features.filter(f => f.properties.wdir);
            resolve(stations); //
        });
    });
}

function barbs(stations, barbGroup, projection, priority = 2, path) {
    const Group = barbGroup
        .selectAll("wind-barbs")
        .data(stations.filter(f => f.properties.prior <= priority)).enter()


    const tailGroup = Group.append("g")
        .attr("class", d =>  `barb wspd-${d.properties.wspd}`)
        .attr("transform", d => {
            return `translate(${projection(d.geometry.coordinates)})
                scale(0.2) rotate(${90 + d.properties.wdir} 35 155)`;
        });

    const cloudGroup = Group.append("g")
        .attr("class", d =>  `cloud cover-${d.properties.cover}`)
        .attr("transform", d => {
            return `translate(${projection(d.geometry.coordinates)}) scale(0.2)`;
        });

    renderWindBarbs(tailGroup, { paddingLeft: 35, paddingTop: 5 });
    renderCloud(cloudGroup, { paddingLeft: 35, paddingTop: 5 })
}

function renderCloud(container, prop){
    /* Sources:
        http://ww2010.atmos.uiuc.edu/(Gh)/guides/maps/sfcobs/wnd.rxml
        http://ww2010.atmos.uiuc.edu/(Gh)/guides/maps/sfcobs/cldcvr.rxml
        https://www.aviationweather.gov/taf/help?page=plot */
    const r = 30;
    const cloudData = [{
        "d": `M${prop.paddingLeft},155 m0,${-r} l0,${r*2}`
    },{
        "d": `M${prop.paddingLeft},155 m0,${-r} l0,${r*2}
              M${prop.paddingLeft},155 v${-r} a${r},${r} 0 0,1 ${r},${r} z`
    },{
        "d": `M${prop.paddingLeft},155 h${-r} a${r},${r} 0 1,0 ${r},${-r} z`
    },{
        "d": `M${prop.paddingLeft},155 m${-r},0 a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-r*2},0`
    },{
        "d": `M${prop.paddingLeft - r},155 l${r*2},0 M${prop.paddingLeft},${155 + r} l0,${-2*r}`,
        "trans": `rotate(-45 ${prop.paddingLeft} 155)`
    },{
        "d": `M${prop.paddingLeft},155 m${-r/2},${-r/2} l0,${r} m0,${-r}
                l${r/2},${r*0.8} m0,0 l${r/2},${-r*0.8} m0,0 l0,${r}`
    }];

    container.append("g")
            .selectAll("path")
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

function renderWindBarbs(container, prop) {

    addCircles(container, prop);

    addPoligonToSvg(container, prop);

    addLinesToSvg(container, prop);
}

function addLinesToSvg(container, prop) {
    container.selectAll("line")
        .data(d => renderLines(d.properties.wspd, prop) )
        .enter()
        .append("line")
        .attr("x1", d => d.x1)
        .attr("x2", d => d.x2)
        .attr("y1", d => d.y1)
        .attr("y2", d => d.y2)
        .attr("stroke", d => d.stroke)
        .style("stroke-width", d => d.strokeWidth)
        .style("stroke-linecap", "round");

    function renderLines(wspd = 0, prop){
        const numberFlags = Math.floor(wspd/50);
        if(numberFlags >= 1){
            wspd = wspd - numberFlags * 50;
        }

        const numberFlippers = Math.floor(wspd/10);
        const hasHalfFlippers = wspd % 10 >= 5 ? true : false;
        const paddingLeft = prop.paddingLeft;
        const paddingTop = prop.paddingTop;
        return addLinesToDataArray({paddingLeft, paddingTop, numberFlippers, hasHalfFlippers, numberFlags });
    }

    function addLinesToDataArray(newProp){
        const prop = {
                baseLenght: 80,    paddingTop: 0,
                paddingLeft: 5,     width: 40,
                numberFlippers: 3,  flipperPadding: 15,
                numberFlags: 1,     hasHalfFlippers: true
        };
        if(newProp){
            Object.assign(prop, prop, newProp);
        }

        const data = [];
        if (prop.numberFlippers > 0 || prop.hasHalfFlippers || prop.numberFlags > 0) {
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
                  "x1": l.x1 || 0,
                  "x2": l.x2 || 0,
                  "y1": l.y1 || 0,
                  "y2": l.y2 || 0,
                  "stroke": l.stroke || "#555555",
                  "strokeWidth": l.strokeWidth || 6
          }
    }
}



function addPoligonToSvg(container, prop){
    const width = 40;
    const points = `${prop.paddingLeft},${prop.paddingTop}, ${prop.paddingLeft + width},
        ${prop.paddingTop}, ${prop.paddingLeft}, ${prop.paddingTop + width}`;

	const flagData = [{
        points: points,
        stroke: "#555555",
        strokeWidth: 6
    }];
  	container.selectAll("polygon")
      .data(flagData)
      .data(d => d.properties.wspd >= 50 ? flagData : [] )
      .enter()
      .append("polygon")
      .attr("points", d => d.points)
      .attr("stroke", d => d.stroke)
      .style("fill", d => d.stroke)
      .style("stroke-width", d => d.strokeWidth);
}

//Add circles
function addCircles(svgContainer, prop){

    const circleData = createCircleData(prop.paddingLeft, prop.paddingTop, [
        { "cx": 0, "cy": 150, "r": 30, "fill": "none" }
    ]);

    svgContainer.append("g")
            .selectAll("circle")
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
              "cx": c.cx + paddingLeft || 0,
              "cy": c.cy + paddingTop || 0,
              "r": c.r || 0,
              "fill": c.fill || "none",
              "stroke": c.stroke || "#555555",
              "strokeWidth": c.strokeWidth || 6
            }
        });
    }
}
