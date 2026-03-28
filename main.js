import { initMap } from './map.js?v=2';
import { createHexGrid } from './hexgrid.js?v=9';
import { createBuildingsLayer } from './buildings.js?v=9';
import { createForestLayer } from './forest.js?v=12';
import { createRoadsLayer } from './roads.js?v=13';
import { createHillsLayer } from './hills.js?v=17';
import { createBrushLayer } from './brush.js?v=2';
import { startControls } from './controls.js?v=2';

const { stage, layer } = await initMap('container');

const gridLayer = createHexGrid();
stage.add(gridLayer);

const roadsLayer = createRoadsLayer();
stage.add(roadsLayer);

const buildingsLayer = await createBuildingsLayer();
stage.add(buildingsLayer);

const forestLayer = await createForestLayer();
stage.add(forestLayer);

const mapImages = layer.getChildren().map(k => k.image());
const hillsLayer = await createHillsLayer();
stage.add(hillsLayer);

const brushLayer = await createBrushLayer(mapImages);
stage.add(brushLayer);

startControls(layer, gridLayer, roadsLayer, buildingsLayer, forestLayer, hillsLayer, brushLayer);
