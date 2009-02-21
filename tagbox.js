/**
 * TagBox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @version pre-0.1
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * TagBox was heavily inspired by the work of Apple Inc., Facebook Inc.,
 * Guillermo Rauch, Diego Perini, and Ran Grushkowsky/InteRiders Inc., but
 * was written from scratch without use of their work.  See the CREDITS file
 * for more information.
 */
var TagBox = Class.create( {
    options: $H( {
        separator: ',' // used to separate 
    } ),

    input: null, // the primary text input element
    tags: null,  // a Hash of TagBox.Tag objects

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     */
    initialize: function( element ) {
        this.input = $( element ).hide();
        this.tags = new Hash();
    },

    /**
     * Create a new text <input/> element, complete with appropriate
     * event handlers
     *
     * @return Element a text <input/> element
     */
    createInput: function() {
        return new Element( 'input', { type: 'text' } );
    }
} );

/**
 * TagBox Tag
 */
TagBox.Tag = Class.create( {
    properties: $H( {
        label: null,    // The string displayed in the TagBox
        value: null     // The value sent to the server when the form is submitted
    } ),

    /**
     * Tag constructor
     *
     * @param Hash a hash of tag properties.
     */
    initialize: function( properties ) {
        this.properties.update( properties );
    },

    /**
     * Create the tag's html element
     *
     * @param String (optional) The wrapper tag name. default: "li"
     *
     * @return Element
     */
    getElement: function( wrapper_tag_name ) {
        var wrapper_tag_name = arguments[0] || 'li';

        return new Element( wrapper_tag_name ).update( this.properties.get( 'label' ) );
    }
} );

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
