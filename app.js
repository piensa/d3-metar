
import * as d3 from "d3";


//
//     function createCircleData(paddinLeft = 0, circleData){
//   		return circleData.map(c => {
//         	return {
//               "cx": c.cx + paddinLeft || 0,
//               "cy": c.cy || 0,
//               "r": c.r || 0,
//               "fill": c.fill || "none",
//               "stroke": c.stroke || "#555555",
//               "strokeWidth": c.strokeWidth || 4
//             }
//         });
//     }



//     const circleData = createCircleData(100, [
//     	{ "cx": 0, "cy": 145, "r": 8, "fill": "#555555" },
//     	{ "cx": 0, "cy": 145, "r": 16, "fill": "none" }
//     ]);
//
//
// const circleGroup = svgContainer.append("g");
//
// //Add circles to the circleGroup
// const circles = circleGroup.selectAll("circle")
// 							.data(circleData)
// 							.enter()
// 							.append("circle");
//
// const circleAttributes = circles
// 							.attr("cx", d => d.cx)
// 							.attr("cy", d => d.cy)
// 							.attr("r", d => d.r)
// 							.attr("stroke", d => d.stroke)
// 							.style("stroke-width", d => d.strokeWidth)
// 							.style("fill", d => d.fill);


export default function addLinesToSvg(container, prop = {
       baseLenght: 100,
       paddingLeft: 100,
       paddingTop: 5,
       flipperPadding: 15,
       width: 40,
       numberFlippers: 3,
       numberFlags: 0,
       hasHalfFlippers: true
   }){
      const data = [];
      const base = createline({ "x1": prop.paddingLeft, "x2": prop.paddingLeft,
                               	"y1": prop.baseLenght + prop.width + prop.paddingTop,
                                "y2": prop.width + prop.paddingTop });
      data.push(base);

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

     container.selectAll("line")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", d => d.x1)
      .attr("x2", d => d.x2)
      .attr("y1", d => d.y1)
      .attr("y2", d => d.y2)
      .attr("stroke", d => d.stroke)
      .style("stroke-width", d => d.strokeWidth);
  }

function createline(l){
      return {
              "x1": l.x1 || 0, "x2": l.x2 || 0, "y1": l.y1 || 0, "y2": l.y2 || 0,
              "stroke": l.stroke || "#555555",
              "strokeWidth": l.strokeWidth || 4
      }
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
