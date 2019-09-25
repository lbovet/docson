import docson from './index';
import $ from 'jquery';

// not sure if this is the orthodox way, but if we're bundling jQuery anyway, why not expose it for the page to use
docson.jquery = $;
export default docson;
