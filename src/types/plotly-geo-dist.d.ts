/** Ambient types for plotly geo partial bundle + factory (no published .d.ts on geo-dist). */
declare module "plotly.js-geo-dist" {
  import type Plotly from "plotly.js";
  const PlotlyGeo: typeof Plotly;
  export default PlotlyGeo;
}

declare module "react-plotly.js/factory" {
  import type { ComponentType } from "react";
  import type { PlotParams } from "react-plotly.js";

  export default function createPlotlyComponent(
    plotly: unknown,
  ): ComponentType<PlotParams>;
}
