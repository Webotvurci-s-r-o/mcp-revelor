import { registerTool } from '../registry.js';
import { pinTopItemTool } from './pin_top_item.js';
import { updateTopItemPositionTool } from './update_top_item_position.js';
import { setProductScoreTool } from './set_product_score.js';
import { setProductHiddenTool } from './set_product_hidden.js';
import { addSynonymTool } from './add_synonym.js';
import { updateCtrWeightsTool } from './update_ctr_weights.js';

registerTool(pinTopItemTool);
registerTool(updateTopItemPositionTool);
registerTool(setProductScoreTool);
registerTool(setProductHiddenTool);
registerTool(addSynonymTool);
registerTool(updateCtrWeightsTool);
