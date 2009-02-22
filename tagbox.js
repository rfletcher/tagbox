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

    original_input: null,   // the original text input element that we've replaced
    input: null,            // the primary text input element
    tags: null,             // a Hash of TagBox.Tag objects
    tagbox: null,           // the tagbox (<ul/>) element

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     */
    initialize: function( original_input ) {
        this.tags = [];
        this.input = this.createInput();

        // create the tagbox list and insert it into the document
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.input );
        this.original_input = $( original_input ).replace( this.tagbox );
    },

    /**
     * Add a Tag to the list
     */
    addTag: function( value ) {
        var tag = new TagBox.Tag( { value: value } );
        tag.tagbox = this;

        this.tags.push( tag );

        this.input.insert( { before: tag.getElement() } );
    },

    /**
     * Create a new text <input/> element, complete with appropriate
     * event handlers
     *
     * @return Element a text <input/> element
     */
    createInput: function( attributes ) {
        var input = new Element( 'input', Object.extend( $H( attributes ), { type: 'text' } ) );

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

        return new Element( 'li' ).insert( input );
    }
} );

/**
 * Get an array of tag values
 *
 * @param Element an ancestor element of the TagBox
 *
 * @return Array an array of values
 */
TagBox.values = function( el ) {
    return $( el ).select( 'li.tagbox-tag input[type=hidden]' ).collect( function( el ) {
        return el.value; 
    } );
}

/**
 * TagBox Tag
 */
TagBox.Tag = Class.create( {
    properties: $H( {
        value: null // The string displayed in the TagBox
    } ),

    tagbox: null,   // the parent TagBox

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
     * @return Element
     */
    getElement: function() {
        var value = this.properties.get( 'value' );

        var li = new Element( 'li', { 'class': 'tagbox-tag' } );

        // the hidden input which represents this tag in the form
        var input = new Element( 'input', {
            type: 'hidden',
            name: this.tagbox.original_input.getAttribute( 'name' ) + '[]',
            value: value
        } );

        return li.insert( value ).insert( input );
    }
} );

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
