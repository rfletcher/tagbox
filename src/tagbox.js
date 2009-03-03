/*
 * TagBox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @version <%= TAGBOX_VERSION %>
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * TagBox was heavily inspired Guillermo Rauch's TextboxList.
 * Portions retain his copyright.
 */

//= require "lib/util"
//= require "lib/TagBox"
//= require "lib/TagBox.Tag"
//= require "lib/ElasticTextBox"

/* Initialize the tagboxes when the DOM is ready */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
