/*
 * Tagbox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @link http://github.com/rfletcher/tagbox
 * @version <%= TAGBOX_VERSION %>
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Tagbox was heavily inspired Guillermo Rauch's TextboxList.
 * Portions retain his copyright.
 */

//= require "lib/util"
//= require "lib/Tagbox"
//= require "lib/Tagbox.Tag"
//= require "lib/Tagbox.Autocomplete"
//= require "lib/Tagbox.Autocomplete.Tag"
//= require "lib/ElasticTextBox"

/* Initialize the tagboxes when the DOM is ready */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new Tagbox( el ); } );
} );
