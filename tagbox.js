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
    options: {
        allow_duplicates: false,    // allow duplicate tags?
        case_sensitive: true        // case sensitivity matching when searching for duplicate tags
    },

    current: null,          // the <li/> with the focus
    original_input: null,   // the original text input element that we've replaced
    tagbox: null,           // the tagbox (<ul/>) element
    tags: null,             // a Hash of TagBox.Tag objects

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     */
    initialize: function( original_input ) {
        this.options = new Hash( this.options );
        this.tags = [];

        // create the tagbox list and insert it into the document
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.createInput() );
        this.original_input = $( original_input ).replace( this.tagbox );

        this.focus( this.tagbox.select( 'li' ).last() );

        this.registerEventHandlers();
    },

    /**
     * Add a Tag to the list
     */
    addTag: function( value ) {
        value = value.replace( /^\s+/, '' ).replace( /\s+$/, '' );

        if( ! value || ! this.options.get( 'allow_duplicates' ) && this.findTagByValue( value ) ) {
            return;
        }

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
        if( this.current ) {
            if( this.current.down( 'input' ) ) {
                this.current.down( 'input' ).blur();
            }
            this.current.removeClassName( 'tagbox-selected' );
            this.current = null;
        }
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
     * Find a Tag object by value
     *
     * @param String the tag value
     *
     * @return Tag
     */
    findTagByValue: function( value ) {
        return this.tags.find( function( tag ) {
            var val1 = tag.getValue();
            var val2 = value;

            if( ! this.options.get( 'case_sensitive' ) ) {
                val1 = val1.toLowerCase();
                val2 = val2.toLowerCase();
            }

            return val1 == val2;
        }.bind( this ) );
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
            var new_el = this.current.previous();
        } else if ( direction == Event.KEY_RIGHT ) {
            var new_el = this.current.next();
        }

        if( new_el ) {
            this.focus( new_el );
        }
    },

    /**
     * Register event handlers
     */
    registerEventHandlers: function() {
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
        document.observe( Prototype.Browser.Gecko ? 'keypress' : 'keydown', function( e ) {
            // e.stop();
            if( ! this.current ) {
                return;
            }
            switch( e.keyCode ) {
                case Event.KEY_LEFT:
                case Event.KEY_RIGHT:
                    this.move( e.keyCode );
                    break;
                case Event.KEY_BACKSPACE:
                case Event.KEY_DELETE:
                    this.remove();
            }
        }.bind( this ) );

        // When another part of the document is clicked, blur the tagbox
        document.observe( 'click', function( e ) {
            this.blur();
        }.bind( this ) );
    },

    /**
     * Remove the selected tag
     */
    remove: function() {
        if( ! this.current || ! this.current.hasClassName( 'tagbox-tag' ) ) {
            return;
        }

        // remove the Tag object from the array of tags
        this.tags = this.tags.without( this.findTagByValue( this.current.down( 'input' ).value ) );

        // remove the element from the list
        var tag_el = this.current;
        this.focus( this.current.next() );
        tag_el.remove();
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
    properties: {
        value: null    // The string displayed in the TagBox
    },

    tagbox: null,   // the parent TagBox

    /**
     * Tag constructor
     *
     * @param Hash a hash of tag properties.
     */
    initialize: function( properties ) {
        this.properties = new Hash( this.properties );
        this.properties.update( properties );
    },

    /**
     * Create the tag's html element
     *
     * @return Element
     */
    getElement: function() {
        var value = this.getValue();;

        var li = new Element( 'li', { 'class': 'tagbox-tag' } );

        // the hidden input which represents this tag in the form
        var input = new Element( 'input', {
            type: 'hidden',
            name: this.tagbox.original_input.getAttribute( 'name' ) + '[]',
            value: value
        } );

        return li.insert( value ).insert( input );
    },

    /**
     * Get the Tag's value
     *
     * @return String value
     */
    getValue: function() {
        return this.properties.get( 'value' );
    }
} );

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
