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

    element: null,  // the original text input element
    input: null,    // the primary text input element
    tags: null,     // a Hash of TagBox.Tag objects
    tagbox: null,   // the tagbox (<ul/>) element

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     */
    initialize: function( element ) {
        this.element = $( element ).hide();
        this.tags = [];
        this.input = this.createInput();

        // create the tagbox list and insert it into the document
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.input );
        this.element.insert( { before: this.tagbox } );
    },

    /**
     * Add a Tag to the list
     */
    addTag: function( value ) {
        var tag = new TagBox.Tag( { value: value } );
        this.tags.push( tag );

        this.input.insert( { before: tag.getElement() } );
    },

    /**
     * Create a new text <input/> element, complete with appropriate
     * event handlers
     *
     * @return Element a text <input/> element
     */
    createInput: function() {
        var input = new Element( 'input', { type: 'text' } );

        input.observe( 'keydown', function( e ) {
            var el = e.element();

            switch( e.keyCode ) {
                case Event.KEY_RETURN:
                    e.stop();
                    this.addTag( el.value );
                    el.value = '';
                    break;
            }
        }.bind( this ) );

        return new Element( 'li', { 'class': 'tagbox-tag' } ).insert( input );
    }
} );

/**
 * TagBox Tag
 */
TagBox.Tag = Class.create( {
    properties: $H( {
        value: null // The string displayed in the TagBox
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

        return new Element( wrapper_tag_name ).update( this.properties.get( 'value' ) );
    }
} );

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
