/**
 * TagBox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @version pre-0.1
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * TagBox was heavily inspired Guillermo Rauch's TextboxList.
 * Portions retain his copyright.
 */

// Add a few KEY_* constants to prototype's Event object
Object.extend( Event, {
    KEY_COMMA: 188,
    KEY_SEMICOLON: 59,
    KEY_SPACE: 32
} );

/**
 * TagBox
 *
 * @event tagbox:blur
 * @event tagbox:focus
 */
var TagBox = Class.create( {
    options: {
        allow_duplicates: false,    // allow duplicate tags?
        case_sensitive: false,      // case sensitivity matching when searching for duplicate tags
        triggers:                   // array of keyCodes which trigger addition to the list of tags
            [ Event.KEY_COMMA, Event.KEY_RETURN ]
    },

    current: null,          // the <li/> with the focus
    original_input: null,   // the original text input element that we've replaced
    tagbox: null,           // the tagbox (<ul/>) element
    tags: null,             // a Hash of TagBox.Tag objects

    /**
     * TagBox constructor
     *
     * @param Element the original input element
     * @param Object  TagBox options
     */
    initialize: function( original_input, options ) {
        this.options = new Hash( this.options ).update( options );
        this.tags = [];

        // create the tagbox list and replace the original text input with it
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.createInput() );
        this.original_input = $( original_input ).replace( this.tagbox );

        // register event handlers for descendent elements
        this.registerEventHandlers();
    },

    /**
     * Event methods
     * See prototype's Event docs for usage
     */
    fire:          function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },
    observe:       function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },
    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

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

        tag_el.observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            e.stop();
            this.focus( tag_el );
        }.bind( this ) );

        this.current.insert( { before: tag_el } );
    },

    /**
     * Remove the focus from the current tag or input <li/>
     *
     * @param Bool call the descendent input's native blur() method (default: true)
     */
    blur: function( update_input_focus ) {
        if( this.current ) {
            this.current.removeClassName( 'tagbox-selected' );
            if( update_input_focus !== false && this.currentIsInput() ) {
                this.current.down( 'input[type=text]' ).blur();
            }
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
        this.registerInputEventHandlers( input );

        var li = new Element( 'li' ).insert( input );
        new ElasticTextBox( input );

        return li;
    },

    /**
     * Test whether the current node is an input node
     */
     currentIsInput: function() {
         return this.current && ! this.current.hasClassName( 'tagbox-tag' ) && this.current.down( 'input' );
     },

     /**
      * Test whether the current node is a tag node
      */
      currentIsTag: function() {
          return this.current && this.current.hasClassName( 'tagbox-tag' );
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
    focus: function( el, update_input_focus ) {
        if( el && el.hasClassName( 'tagbox-selected' ) ) {
            return;
        }

        var had_focus = this.hasFocus();

        // remove focus from any selected, individual tag or input
        this.blur( update_input_focus );

        // set focus on the specified element
        if( ! el ) {
            this.tagbox.removeClassName( 'tagbox-selected' );
        } else if( el.parentNode == this.tagbox ) {
            [ this.tagbox, el ].invoke( 'addClassName', 'tagbox-selected' );

            this.current = el;

            if( this.currentIsInput() && update_input_focus != false ) {
                ( function() {
                    this.current.down( 'input[type=text]' ).focus();
                }.bind( this ) ).defer();
            }
        }

        // fire events if the tagbox focus has changed
        if( had_focus && ! this.hasFocus() ) {
            this.fire( 'tagbox:blur' );
        } else if( ! had_focus && this.hasFocus() ) {
            this.fire( 'tagbox:focus' );
        }
    },

    /**
     * Test whether the TagBox has the focus
     *
     * @return Bool
     */
    hasFocus: function() {
        return this.tagbox.hasClassName( 'tagbox-selected' );
    },

    /**
     * Move the focus around the TagBox
     */
    move: function( direction ) {
        switch( direction ) {
            case 'first':
            case 'last':
                var new_el = this.tagbox.select( 'li' )[direction]();
                break;
            case 'previous':
            case 'next':
                var new_el = this.current[direction](); break;
        }

        if( new_el ) {
            this.focus( new_el );

            if( direction == 'last' ) {
                // tricky way to move the mouse cursor to the end of the text
                var i = new_el.down( 'input' ), v = i.value;
                i.value += ' ';
                i.value = v;
            }
        }
    },

    /**
     * Register event handlers
     */
    registerEventHandlers: function() {
        document.observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            var el = Event.element( e );

            // set the focus when the tagbox is clicked
            if( el == this.tagbox || el.descendantOf( this.tagbox ) ) {
                this.tagbox.select( 'li' ).last().down( 'input' ).focus();

            // remove focus from the tagbox when another part of the document is clicked
            } else {
                this.focus( false );
            }
        }.bind( this ) );

        // monitor keypresses for tag navigation/deletion
        document.observe( Prototype.Browser.Gecko ? 'keypress' : 'keydown', function( e ) {
            if( ! this.hasFocus() ) {
                return;
            }

            switch( e.keyCode ) {
                case Event.KEY_TAB:
                    if( this.currentIsTag() ) {
                        this.tagbox.select( 'li' ).last().down( 'input' ).focus();
                    }
                    this.focus( false, false );
                    break;

                case Event.KEY_HOME:
                    this.move( 'first' );
                    break;
                case Event.KEY_END:
                    this.move( 'last' );
                    break;

                case Event.KEY_LEFT:
                    if( this.currentIsInput() && this.current.down( 'input' ).getCaretPosition() !== 0 ) {
                        break;
                    }
                    this.move( 'previous' );
                    break;
                case Event.KEY_RIGHT:
                    this.move( 'next' );
                    break;

                case Event.KEY_BACKSPACE:
                    if( this.currentIsInput() && this.current.down( 'input' ).getCaretPosition() === 0 ) {
                        var direction = 'previous';
                    }
                case Event.KEY_DELETE:
                    if( e.keyCode == Event.KEY_DELETE && this.currentIsInput() && this.current.down( 'input' ).getCaretPosition() === this.current.down( 'input' ).value.length ) {
                        var direction = 'next';
                    }

                    if( direction ) {
                        this.move( direction );
                        e.stop();
                    } else if( this.currentIsTag() ) {
                        this.remove();
                        e.stop();
                    }
            }
        }.bind( this ) );
    },

    /**
     * Register <input/> element event handlers
     *
     * @param Element an <input/> element
     */
    registerInputEventHandlers: function( input ) {
        input.observe( 'keydown', function( e ) {
            var el = e.element();

            if( this.options.get( 'triggers' ).include( e.keyCode ) ) {
                e.stop();
                this.addTag( el.value );
                el.value = '';
            }
        }.bind( this ) ).observe( 'focus', function( e ) {
            this.focus( Event.element( e ).up( 'li' ) );
        }.bind( this ) );
    },

    /**
     * Remove the focused tag
     */
    remove: function() {
        if( ! this.currentIsTag() ) {
            return;
        }

        // remove the Tag object from the array of tags
        this.tags = this.tags.without( this.findTagByValue( this.current.down( 'input' ).value ) );

        // remove the element from the list
        var tag_el = this.current;
        this.focus( this.current.next() );
        tag_el.remove();
    },

    /**
     * Get an arry of tag values
     */
    values: function() {
        return TagBox.values( this.tagbox );
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

        return li.insert( value.escapeHTML() ).insert( input );
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
 * ElasticTextBox
 */
var ElasticTextBox = Class.create( {
    options: {
        minWidth: 50,
        pad: 10
    },

    input: null,    // the <input/> element
    proxy: null,    // the proxy <div/>

    /**
     * ResizableTextBox constructor
     */
    initialize: function( input ) {
        this.options = new Hash( this.options );
        this.input = $( input );

        this.registerEventHandlers( this.input );
        this.createProxy();
        this.updateWidth();
    },

    /**
     * Create the proxy node and insert it into the DOM
     */
    createProxy: function() {
        this.proxy = new Element( 'span' ).setStyle( {
            display: 'inline-block',
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre'
        } );

        this.input.insert( {
            after: new Element( 'div' ).setStyle( {
                position: 'absolute',
                overflow: 'hidden',
                width: '1px',
                height: '1px',
                visibility: 'hidden'
            } ).update( this.proxy )
        } );
    },

    /**
    * Register event handlers
     */
    registerEventHandlers: function() {
        this.input.observe( 'keypress', this.updateWidth.bind( this ) );
        this.input.observe( 'keyup', this.updateWidth.bind( this ) );
    },

    /**
     * Update the width of the text box
     */
    updateWidth: function() {
        this.proxy.innerHTML = this.input.value.escapeHTML();
        this.input.setStyle( {
            width: parseFloat( this.proxy.getStyle( 'width' ) || 0 ) +
                   this.options.get( 'pad' ) + 'px'
        } );
    }
} );

// Add methods to form input elements
Object.extend( Form.Element.Methods, {
    /**
     * Get the current caret position
     *
     * @param Element the form element on which this method is called
     */
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

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
