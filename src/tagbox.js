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

// Add a few KEY_* constants to prototype's Event object
Object.extend( Event, {
    KEY_COMMA: 44,
    KEY_SEMICOLON: 59,
    KEY_SPACE: 32
} );

// Add methods to form input elements
Object.extend( Form.Element.Methods, {
    /**
     * Form.Element.getCaretPosiiton( element ) -> Number
     *   - element (Element): A text input element.
     *
     * Get a text input current caret position.
     **/
    getCaretPosition: function( element ) {
        if( element.createTextRange ) {
            var r = document.selection.createRange().duplicate();
            r.moveEnd( 'character', element.value.length );
            if( r.text === '' ) {
                return element.value.length;
            }
            return element.value.lastIndexOf( r.text );
        } else {
            return element.selectionEnd ? element.selectionEnd : element.selectionStart;
        }
    }
} );
Element.addMethods();

//= require "lib/TagBox"
//= require "lib/TagBox.Tag"
//= require "lib/ElasticTextBox"

/* Initialize the tagboxes when the DOM is ready */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
