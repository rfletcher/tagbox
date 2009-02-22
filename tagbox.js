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

    current: null,          // the <li/> with the focus
    has_focus: false,       // 
    original_input: null,   // the original text input element that we've replaced
    tags: null,             // a Hash of TagBox.Tag objects
    tagbox: null,           // the tagbox (<ul/>) element

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     */
    initialize: function( original_input ) {
        this.tags = [];


        // create the tagbox list and insert it into the document
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.createInput() );
        this.original_input = $( original_input ).replace( this.tagbox );

        this.focus( this.tagbox.select( 'li' ).last() );

        this.registerEventHandlers();
    },

    /**
     * Register event handlers
     */
    registerEventHandlers: function( object ) {
        // set the focus when the tagbox is clicked
        this.tagbox.observe( 'click', function( e ) {
            e.stop();
            this.focus( this.tagbox.childElements().last() );
        }.bind( this ) );

        document.observe( Prototype.Browser.IE ? 'keypress' : 'keydown', function( e ) {
            if( this.current && this.current.hasClassName( 'tagbox-tag' ) && e.keyCode == Event.KEY_BACKSPACE ) {
                e.stop();
            }
        }.bind( this ) );

        // when 
        document.observe( 'keyup', function( e ) {
            e.stop();
            if( ! this.current ) {
                return;
            }
            switch( e.keyCode ) {
                case Event.KEY_LEFT:
                case Event.KEY_RIGHT:
                    this.move( e.keyCode );
            }
        }.bind( this ) );

        // When another part of the document is clicked, blur the tagbox
        document.observe( 'click', function( e ) {
            this.blur();
        }.bind( this ) );
    },

    /**
     * Add a Tag to the list
     */
    addTag: function( value ) {
        var tag = new TagBox.Tag( { value: value } );
        tag.tagbox = this;

        this.tags.push( tag );

        var tag_el = tag.getElement();
        tag_el.observe( 'click', function( e ) {
            e.stop();
            this.focus( tag_el );
        }.bind( this ) );

        this.current.insert( { before: tag_el } );
    },

    /**
     * Remove the focus from a tag or input <li/>
     *
     * @param Element
     */
    blur: function() {
        this.current && this.current.removeClassName( 'tagbox-selected' );
    },

    /**
     * Create a new text <input/> element, complete with appropriate
     * event handlers
     *
     * @return Element a text <input/> element
     */
    createInput: function( attributes ) {
        var input = new Element( 'input', $H( attributes ).update( { type: 'text' } ).toObject() );

        input.observe( 'keypress', function( e ) {
            var el = e.element();

            switch( e.keyCode ) {
                case Event.KEY_RETURN:
                    e.stop();
                    this.addTag( el.value );
                    el.value = '';
            }
        }.bind( this ) );

        return new Element( 'li' ).insert( input );
    },

    /**
     * Set the focus on a tag or input <li/>
     *
     * @param Element
     */
    focus: function( el ) {
        this.blur();
        el.addClassName( 'tagbox-selected' );
        this.current = el;

        if( this.current.select( 'input' ) ) {
            this.current.select( 'input' ).first().focus();
        }
    },

    /**
     * Move the focus around the TagBox
     */
    move: function( direction ) {
        // check and see if the cursor is at the beginning/end of a textbox

        if( direction == Event.KEY_LEFT ) {
            var new_el = this.current.previous( 'li' );
        } else if ( direction == Event.KEY_RIGHT ) {
            var new_el = this.current.next( 'li' );
        }

        if( new_el ) {
            this.focus( new_el );
        }
    },
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
