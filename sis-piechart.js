require.config({
  paths: {
    popper: "https://unpkg.com/@popperjs/core@2/dist/umd/popper",
  },
});

define([
  "require",
  "qlik",
  "jquery",
  "./src/js/sis-radial",
  "text!./src/css/index.css",
  "popper",
], function (require, qlik, $, sisRadial, cssContent, popper) {
  "use strict";

  $("<style>").html(cssContent).appendTo("head");

  /* DATA EXAMPLE
    {
      key: "ejemplo",
      title: "ejemplo"
      values: [
        {
          key: "metrica-ejemplo",
          sectionCount: 2,
          parent: "ejemplo",
          value: 0,
        }
      ]
    }*/

  function structureData(hyperCube) {
    var data = [];

    //Create parent structure
    for (let i = 0; i < hyperCube.qDataPages[0].qMatrix.length; i++) {
      let object = {
        key: hyperCube.qDimensionInfo[0].cId + i,
        title: hyperCube.qDataPages[0].qMatrix[i][0].qText,
      };

      //Add values structure
      object.values = [];
      for (let j = 0; j < hyperCube.qMeasureInfo.length; j++) {
        let value = {
          key: hyperCube.qMeasureInfo[j].cId,
          title: hyperCube.qMeasureInfo[j].qFallbackTitle,
          sectionCount: hyperCube.qMeasureInfo.length,
          parent: object.key,
          value: 0,
        };

        object.values.push(value);
      }

      data.push(object);
    }

    //console.log(data);
    //Give actual values to objects based on qMatrix data
    for (let i = 0; i < hyperCube.qDataPages[0].qMatrix.length; i++) {
      for (let j = 1; j < hyperCube.qDataPages[0].qMatrix[i].length; j++) {
        data[i].values[j - 1].value =
          hyperCube.qDataPages[0].qMatrix[i][j].qNum;
      }
    }

    return data;
  }

  let popperInstance = null;

  function createPopper(referenceElement, popperElement) {
    popperInstance = popper.createPopper(referenceElement, popperElement, {
      modifiers: {
        options: {
          boundariesElement: "scrollParent",
        },
      },
    });
  }

  function destroyPopper() {
    if (popperInstance) {
      popperInstance.destroy();
      popperInstance = null;
    }
  }

  function setHoverListeners() {
    $(".intermediate-path").on("mouseenter", (event) => {
      var tooltip = $(".tooltip[data-parent=" + $(event.target).attr("id")).get(
        0
      );

      tooltip.setAttribute("data-show", "");
      createPopper(event.target, tooltip);
    });

    $(".intermediate-path").on("mouseleave", (event) => {
      var tooltip = $(".tooltip[data-parent=" + $(event.target).attr("id")).get(
        0
      );
      tooltip.removeAttribute("data-show");
      destroyPopper();
    });
  }

  return {
    initialProperties: {
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: [],
        qInitialDataFetch: [
          {
            qWidth: 9,
            qHeight: 50,
          },
        ],
      },
    },
    definition: {
      type: "items",
      component: "accordion",
      items: {
        dimensions: {
          uses: "dimensions",
          min: 1,
          max: 1,
        },
        measures: {
          uses: "measures",
          min: 1,
          max: 8,
        },
        sorting: {
          uses: "sorting",
        },
        attributes: {
          type: "items",
          label: "Atributes",
          items: {
            rows: {
              type: "integer",
              label: "Rows",
              ref: "numRows",
              defaultValue: 1,
              expression: "optional",
            },
            maxValue: {
              type: "number",
              label: "Max Value",
              defaultValue: 1,
              ref: "maxValue",
              expression: "optional",
            },
          },
        },
        colors: {
          type: "items",
          label: "Colors",
          items: {
            colorScale: {
              type: "items",
              label: "Color scale",
              items: {
                colorA: {
                  type: "object",
                  label: "Color Min Value",
                  component: "color-picker",
                  defaultValue: "#009EE3",
                  ref: "colors.scale.colorStart",
                },
                colorB: {
                  type: "object",
                  label: "Color Max Value",
                  component: "color-picker",
                  defaultValue: "#dfe300",
                  ref: "colors.scale.colorEnd",
                },
              },
            },
          },
        },
      },
    },
    support: {
      snapshot: true,
      export: true,
      exportData: true,
    },
    mounted: function ($element) {
      var container = $("<div>", {
        id: "sis-radial-container-" + this.options.id,
        class: "sis-container",
        style: "width: 100%;height:100%;",
      });

      $(container).append(
        '<div class="grid" style="width: 100%;height:100%;"></grid>'
      );
      $element.html(container);

      return qlik.Promise.resolve();
    },
    updateData: function (layout) {
      var data = structureData(layout.qHyperCube);

      sisRadial.updateRadialViz(layout.qInfo.qId, data, layout.numRows, layout.maxValue, {
        minColor: layout.colors.scale.colorStart.color,
        maxColor: layout.colors.scale.colorEnd.color,
      });
      setHoverListeners();

      return qlik.Promise.resolve();
    },
    resize: function ($element, layout) {
      $element.empty();
      $($element).append(
        '<div class="grid" style="width: 100%;height:100%;"></grid>'
      );
      this.updateData(layout);
    },
  };
});
