define([
  "require",
  "qlik",
  "jquery",
  "./src/js/sis-radial",
  "text!./src/css/index.css",
], function (require, qlik, $, sisRadial, cssContent) {
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
    console.log(hyperCube);

    //Create parent structure
    for (let i = 0; i < hyperCube.qDataPages[0].qMatrix.length; i++) {
      let object = {
        key: hyperCube.qDimensionInfo[0].cId,
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
      console.log(hyperCube.qDataPages[0].qMatrix[i]);
      for (let j = 1; j < hyperCube.qDataPages[0].qMatrix[i].length; j++) {
        data[i].values[j - 1].value =
          hyperCube.qDataPages[0].qMatrix[i][j].qNum;
      }
    }

    return data;
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
              expression: "optional"
            },
            maxValue: {
              type: "number",
              label: "Max Value",
              ref: "maxValue",
              expression: "optional"
            }
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
        id: "sis-radial-container",
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

      sisRadial.updateRadialViz(data, layout.numRows, layout.maxValue);
      return qlik.Promise.resolve();
    },
    resize: function ($element, layout) {
      $element.empty();
      $($element).append(
        '<div class="grid" style="width: 100%;height:100%;"></grid>'
      );
      this.updateData(layout, layout.numRows, layout.maxValue);
    },
  };
});
