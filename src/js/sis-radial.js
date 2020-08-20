define(["jquery", "./d3"], function ($, d3) {
  "use strict";

  const scale = d3.scaleLinear().domain([0, 10]).range(["#009EE3", "#dfe300"]);

  function getArc(i, sectionCount, value, maxValue, props) {
    var r = props.r;
    var angleValue = value > maxValue ? 1 : value / maxValue;
    var sliceAngle = (2 * Math.PI) / sectionCount - props.sepAngle;
    var startAngle = (1 / 2) * Math.PI + sliceAngle * i + props.sepAngle * i;
    var endAngle = startAngle - sliceAngle * angleValue;

    var x0 = r * Math.cos(startAngle) + props.c;
    var y0 = r * -Math.sin(startAngle) + props.c;
    var x1 = r * Math.cos(endAngle) + props.c;
    var y1 = r * -Math.sin(endAngle) + props.c;

    var isLongPath = sectionCount == 1 && angleValue > 0.5 ? 1 : 0;

    return (
      "M " +
      x0 +
      " " +
      y0 +
      " A " +
      r +
      " " +
      r +
      " 0 " +
      isLongPath +
      " 1 " +
      x1 +
      " " +
      y1
    );
  }

  function updateArc(d, maxValue, i) {
    var value = d.value;
    var sectionCount = d.sectionCount;
    var props = getProps();
    var prevValue = d3.select(this).attr("data-prev");
    var interpolate = d3.interpolate(prevValue, value);
    return function (t) {
      return getArc(i, interpolate(t), maxValue, sectionCount, props);
    };
  }

  function getProps(data, numRows) {
    var props = {};
    var grid = d3
      .select("#sis-radial-container .grid")
      .style(
        "grid-template-areas",
        '"' + "a ".repeat(Math.ceil(data.length / numRows)) + '"'
      );
    var gridHeight = grid.node().getBoundingClientRect().height;
    var gridWidth = grid.node().getBoundingClientRect().width;

    props.radius = Math.min(
      gridWidth / Math.ceil(data.length / numRows),
      gridHeight / numRows
    );
    props.padding = props.radius / 32;
    props.innerStroke = props.radius / 2 / 16;
    props.outerStroke = props.innerStroke * 3;
    props.r = props.radius / 2 - props.outerStroke / 2 - props.padding;
    props.sepAngle = Math.PI / 64;
    props.c = props.radius / 2;

    return props;
  }

  function getColor(value) {
    return d3.color(scale(value)).brighter(0.9);
  }

  return {
    updateRadialViz: function (data, numRows, maxValue) {
      var t = d3.transition().duration(500).ease(d3.easeLinear);
      var container = $("#sis-radial-container");

      var grid = d3.select("#sis-radial-container .grid");
      var graph = grid.selectAll(".sis-radial").data(data, (d) => {
        return d.key;
      });

      graph.exit().remove();

      //---Inicializar ---
      var props = getProps(data, numRows);
      var g = graph
        .enter()
        .append("svg")
        .attr("class", "sis-radial")
        .attr("width", props.radius)
        .attr("height", props.radius);

      //CIRCULO EXTERIOR
      g.append("circle")
        .attr("class", "outter-circle")
        .attr("r", props.r)
        .attr("cx", props.radius / 2)
        .attr("cy", props.radius / 2)
        .attr("stroke-width", 0)
        .attr("fill", "red");

      //ARCOS INTERMEDIOS
      var archData = d3
        .selectAll(".sis-radial")
        .selectAll(".paths-container")
        .data(
          (d, i) => {
            return d.values;
          },
          (d) => {
            return d.key;
          }
        );

      archData.exit().transition(t).style("opacity", 0);

      archData //Actualiza datos
        .select(".intermediate-path")
        .attr("class", (d) => {
          return "intermediate-path";
        })
        .style("stroke-dasharray", (d) => {
          return d.value > 0 ? "2 0.01" : "2";
        })
        .transition(t)
        .attrTween("d", (d, i) => {
          return updateArc(d, maxValue, i);
        })
        .attr("data-prev", (d) => {
          return d.value;
        })
        .style("stroke", (d) => {
          return getColor(d.value);
        });

      archData.select(".arc-value textPath").text((d) => {
        return d.value > 0 ? d.value : "";
      });

      var pathContainer = archData
        .enter()
        .append("g")
        .attr("class", "paths-container");

      pathContainer //Inicializa
        .append("path")
        .attr("class", (d) => {
          return "intermediate-path";
        })
        .attr("id", (d, i) => {
          return d.key.replace(" ", "") + "-value-" + d.parent.replace(" ", "");
        })
        .attr("data-prev", (d) => {
          return d.value;
        })
        .attr("d", (d, i) => {
          return getArc(i, d.sectionCount, d.value, maxValue, props);
        })
        .style("fill", "transparent")
        .style("stroke", (d, i) => {
          return getColor(d.value);
        })
        .style("stroke-width", props.innerStroke * 2.5)
        .style("stroke-dasharray", (d) => {
          return d.value > 0 ? "2 0.001" : "2";
        });

      pathContainer
        .append("text")
        .attr("class", "arc-value")
        .style("font-size", "0.5em")
        .append("textPath")
        .attr("dominant-baseline", "central")
        .attr("startOffset", "50%")
        .attr("text-anchor", "middle")
        .attr("xlink:href", (d) => {
          return (
            "#" + d.key.replace(" ", "") + "-value-" + d.parent.replace(" ", "")
          );
        })
        .attr("fill", "#222")
        .text((d) => {
          return d.value > 0 ? d.value : "";
        });

      //INICIALES Y NOMBRE
      props.r -= props.outerStroke / 1.5;

      g.append("text")
        .html((d) => {
          return d.title;
        })
        .attr("x", props.radius / 2)
        .attr("y", props.radius / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        //.attr("textLength", props.radius/2)
        .style("fill", "#999");

      //ARCOS INTERIORES
      archData //Actualiza
        .select(".interior-path")
        .transition(t)
        .style("stroke", (d) => {
          return getColor(d.value);
        });

      pathContainer //Inicializa
        .append("path")
        .attr("class", "interior-path")
        .attr("id", (d) => {
          return d.key.replace(" ", "") + "-ip-" + d.parent.replace(" ", "");
        })
        .style("stroke", (d, i) => {
          return getColor(d.value);
        })
        .attr("d", (d, i) => {
          return getArc(i, d.sectionCount, maxValue, maxValue, props);
        })
        .style("fill", "transparent")
        .style("stroke-width", props.innerStroke / 2);

      //TEXTO ARCOS INTERIORES
      archData
        .select(".measure-name textPath")
        .transition(t)
        .attr("fill", (d) => {
          return getColor(d.value);
        });

      pathContainer
        .append("text")
        .attr("class", "measure-name")
        .attr("width", "100")
        .attr("dy", (d, i) => {
          return "4%";
        })
        .append("textPath")
        .attr("dominant-baseline", "hanging")
        .attr("startOffset", "50%")
        .attr("text-anchor", "middle")
        .attr("xlink:href", (d) => {
          return (
            "#" + d.key.replace(" ", "") + "-ip-" + d.parent.replace(" ", "")
          );
        })
        .attr("fill", (d, i) => {
          return getColor(d.value);
        })
        .text((d, i) => {
          return d.title;
        });
    },
  };
});
