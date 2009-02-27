/*
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
    KEY_COMMA: 44,
    KEY_SEMICOLON: 59,
    KEY_SPACE: 32
} );

/**
 * class TagBox
 *
 * An unobtrusive, multi-value text input.
 *
 * fires tagbox:blur, tagbox:focus
 **/
var TagBox = Class.create( {
    /**
     * TagBox#options -> Hash
     *
     * A Hash of options for this TagBox instance.  Options are:
     *
     *  allow_duplicates (Boolean) = false:
     *      Allow duplicate tags?
     *  case_sensitive (Boolean) = false:
     *      Case sensitive string comparison when checking for duplicate tags?
     *  delimiters (Array) = [ Event.KEY_COMMA, Event.KEY_RETURN ]:
     *      Array of keyCodes which trigger addition to the list of tags.
     *  show_remove_links (Boolean) = false:
     *      Add an 'x' link to each tag.
     **/
    options: {
        allow_duplicates: false,
        case_sensitive: false,
        delimiters: [ Event.KEY_COMMA, Event.KEY_RETURN ],
        show_remove_links: false
    },

    /**
     * TagBox#current -> ( null | Element )
     * The <li/> with the focus.
     **/
    current: null,

    /**
     * TagBox#name -> String
     * The form field name, taken from the original input element.
     **/
    name: null,

    /**
     * TagBox#tagbox -> Element
     * The tagbox (<ul/>) element.
     **/
    tagbox: null,

    /**
     * TagBox#tags -> [ TagBox.Tag... ]
     * An `Array` of `TagBox.Tag` objects.
     **/
    tags: null,

    /**
     * new TagBox( original_input[, options ] )
     *   - original_input (Element | String): The original text input, or a
     *     string that references the input's ID.
     *   - options (Object): Options for this TagBox.
     */
    initialize: function( original_input, options ) {
        this.options = new Hash( this.options ).update( options );
        this.tags = [];
        this.name = $( original_input ).getAttribute( 'name' );

        // create the tag box
        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.createInput() );

        // populate the tag box with tags from the original input
        var delimiters = this.options.get( 'delimiters' ).collect( function( v ) {
            var hex = v.toString( 16 );
            return "\\x" + ( hex.length == 1 ? "0" : "" ) + hex;
        } ).join();

        $( original_input ).value.split( new RegExp( '[' + delimiters + ']' ) ).each( this.addTag.bind( this ) );

        // replace the original input with the tag box
        $( original_input ).replace( this.tagbox );

        // register event handlers for descendent elements
        this.registerEventHandlers();
    },

    /**
     * TagBox#fire()
     * See: Prototype.js Element#fire()
     **/
    fire:          function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },

    /**
     * TagBox#observe()
     * See: Prototype.js Element#observe()
     **/
    observe:       function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },

    /**
     * TagBox#stopObserving()
     * See: Prototype.js Element#stopObserving()
     **/
    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

    /**
     * TagBox#addTag( value )
     *   - value (String): Displayed value of the new tag
     *
     * Add a tag to the list, and select that tag.
     **/
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

        ( this.current || this.tagbox.select( 'li' ).last() ).insert( { before: tag_el } );
    },

    /**
     * TagBox#blur( [ update_input_focus = true ])
     *   - update_input_focus (Boolean): Call the descendent input's native
     *     blur() method.
     *
     * Remove the focus from the current tag or input <li/>.
     **/
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
     * TagBox#createInput( [ attributes ] ) -> Element
     *   - attributes (Object): HTML attributes to pass to the `Element`
     *     constructor.
     *
     * Create a new text <input/> element, complete with appropriate
     * event handlers.
     **/
    createInput: function( attributes ) {
        var input = new Element( 'input', $H( attributes ).update( { type: 'text' } ).toObject() );
        this.registerInputEventHandlers( input );

        var li = new Element( 'li' ).insert( input );
        new ElasticTextBox( input );

        return li;
    },

    /**
     * TagBox#currentIsInput() -> Boolean
     *
     * Test whether the current node is an input node.
     **/
    currentIsInput: function() {
        return Boolean( this.current && ! this.current.hasClassName( 'tagbox-tag' ) && this.current.down( 'input' ) );
    },

     /**
      * TagBox#currentIsTag() -> Boolean
      *
      * Test whether the current node is a tag node.
      **/
    currentIsTag: function() {
        return Boolean( this.current && this.current.hasClassName( 'tagbox-tag' ) );
    },

    /**
     * TagBox#findTagByValue( value ) -> TagBox.Tag
     *      - value (String): A value to find.
     *
     * Find a tag object by value.
     **/
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
     * TagBox#focus( [ element[, update_input_focus ] ] )
     *   - element (Element): The <li/> element to select.
     *   - update_input_focus (Boolean): Call the descendent input's native
     *     blur() method.
     *
     * Set the focus on a tag or input <li/>, or remove focus from the tag box.
     **/
    focus: function( element, update_input_focus ) {
        if( element && element.hasClassName( 'tagbox-selected' ) ) {
            return;
        }

        var had_focus = this.hasFocus();

        // remove focus from any selected, individual tag or input
        this.blur( update_input_focus );

        // set focus on the specified element
        if( ! element ) {
            this.tagbox.removeClassName( 'tagbox-selected' );
        } else if( element.parentNode == this.tagbox ) {
            [ this.tagbox, element ].invoke( 'addClassName', 'tagbox-selected' );

            this.current = element;

            if( this.currentIsInput() && update_input_focus != false ) {
                this.focusInput();
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
     * TagBox#focusInput()
     *
     * Set the focus on the main tagbox text input.
     **/
    focusInput: function() {
        ( function() {
            this.tagbox.select( 'li' ).last().down( 'input[type=text]' ).focus();
        }.bind( this ) ).defer();
    },

    /**
     * TagBox#hasFocus() -> Boolean
     *
     * Test whether the tag box has the focus.
     **/
    hasFocus: function() {
        return this.tagbox.hasClassName( 'tagbox-selected' );
    },

    /**
     * TagBox#move( target )
     *   - target ('first' | 'last' | 'previous' | 'next'): The direction to
     *     move the focus.
     *
     * Move the focus around the tag box
     **/
    move: function( target ) {
        switch( target ) {
            case 'first':
            case 'last':
                var new_el = this.tagbox.select( 'li' )[target]();
                break;
            case 'previous':
            case 'next':
                var new_el = this.current[target](); break;
        }

        if( new_el ) {
            this.focus( new_el );

            if( target == 'last' ) {
                // tricky way to move the mouse cursor to the end of the text
                var i = new_el.down( 'input' ), v = i.value;
                i.value += ' ';
                i.value = v;
            }
        }
    },

    /**
     * TagBox#registerEventHandlers()
     *
     * Register document and tag box element event handlers.
     **/
    registerEventHandlers: function() {
        // monitor for clicks, to set or remove focus
        document.observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            var el = Event.element( e );

            // set the focus when the tagbox is clicked
            if( el == this.tagbox || el.descendantOf( this.tagbox ) ) {
                this.focusInput();

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

            var key = e.which ? e.which : e.keyCode;

            switch( key ) {
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

                    if( this.currentIsInput() && 
                        this.current.down( 'input' ).selectionStart != this.current.down( 'input' ).selectionEnd ) {
                        var direction = null;
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
     * TagBox#registerInputEventHandlers( input )
     *   - input (Element): A tag box input element.
     *
     * Register <input/>-specific event handlers.
     **/
    registerInputEventHandlers: function( input ) {
        input.observe( 'keypress', function( e ) {
            var el = e.element();
            var key = e.which ? e.which : e.keyCode;

            if( this.options.get( 'delimiters' ).include( key ) ) {
                e.stop();
                this.addTag( el.value );
                el.value = '';
            }
        }.bind( this ) ).observe( 'focus', function( e ) {
            this.focus( Event.element( e ).up( 'li' ) );
        }.bind( this ) );
    },

    /**
     * TagBox#remove()
     *
     * Remove the focused tag from the list.
     **/
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
     * TagBox#values() -> [ String... ]
     *
     * Get an `Array` of tag values.
     **/
    values: function() {
        return TagBox.values( this.tagbox );
    }
} );

/**
 * TagBox.values( element ) -> [ String... ]
 *   - element (Element | String): A DOM ancestor of a tag box, or a string
 *     that references the ancestor's ID.
 *
 * Get an `Array` of tag values.
 **/
TagBox.values = function( el ) {
    return $( el ).select( 'li.tagbox-tag input[type=hidden]' ).collect( function( el ) {
        return el.value;
    } );
}

/**
 * class TagBox.Tag
 **/
TagBox.Tag = Class.create( {
    /**
     * TagBox.Tag#properties -> Hash
     *
     * A Hash of public properties for this TagBox.Tag instance.  Properties
     * are:
     *
     *  value (String): the tag's displayed value
     **/
    properties: {
        value: null
    },

    /**
     * TagBox.Tag#tagbox -> TagBox
     *
     * The parent TagBox.
     **/
    tagbox: null,

    /**
     * new TagBox.Tag( properties )
     *   - properties (Object): Properties for this TagBox.Tag.
     **/
    initialize: function( properties ) {
        this.properties = new Hash( this.properties );
        this.properties.update( properties );
    },

    /**
     * TagBox.Tag#getElement() -> Element
     *
     * Create the tag's HTML representation.
     **/
    getElement: function() {
        var value = this.getValue();

        var li = new Element( 'li', { 'class': 'tagbox-tag' } );

        // the hidden input which represents this tag in the form
        var input = new Element( 'input', {
            type: 'hidden',
            name: this.tagbox.name + '[]',
            value: value
        } );

        li.insert( value.escapeHTML() ).insert( input );

        if( this.tagbox.options.get( 'show_remove_links' ) ) {
            var a = new Element( 'a', { 'class': 'tagbox-remove' } ).update( 'Remove' );
            a.observe( 'click', this.tagbox.remove.bind( this.tagbox ) );
            li.insert( a );
        }

        return li;
    },

    /**
     * TagBox.Tag#getValue() -> String
     *
     * Get the Tag's value.
     */
    getValue: function() {
        return this.properties.get( 'value' );
    }
} );

/**
 * class ElasticTextBox
 *
 * Extends text <input/> elements to automatically resize based on the width
 * of their value.
 */
var ElasticTextBox = Class.create( {
    /**
     * ElasticTextBox#options -> Hash
     *
     * A Hash of options for this ElasticTextBox instance.  Options are:
     *
     *  min_width (null | Number) = null: Maximum width for the text input.
     *  max_width (null | Number) = 20: Minimum width for the text input.
     **/
    options: {
        max_width: null,
        min_width: 20
    },

    /**
     * ElasticTextBox#input -> Element
     *
     * The associated input element.
     **/
    input: null,

    /**
     * ElasticTextBox#proxy -> Element
     *
     * A hidden element which mirrors the text input's value, and is used to
     * learn the value's width.
     **/
    proxy: null,

    /**
     * new ElasticTextBox( input )
     *   - input (Element): The input element to make resizable.
     **/
    initialize: function( input ) {
        this.options = new Hash( this.options );
        this.input = $( input );

        this.registerEventHandlers( this.input );
        this.createProxy();
        this.updateWidth();
    },

    /**
     * ElasticTextBox#createProxy()
     *
     * Create the proxy element and insert it into the DOM.
     */
    createProxy: function() {
        this.proxy = new Element( 'span' ).setStyle( {
            display: 'inline-block',
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
     * ElasticTextBox#registerEventHandlers()
     *
     * Register input element event handlers.
     **/
    registerEventHandlers: function() {
        this.input.observe( 'keypress', this.updateWidth.bind( this ) );
        this.input.observe( 'keyup', this.updateWidth.bind( this ) );
    },

    /**
     * ElasticTextBox#updateWidth()
     *
     * Update the width of the input element.
     **/
    updateWidth: function() {
        this.proxy.innerHTML = this.input.value.escapeHTML();

        var pad = parseFloat( this.input.getStyle( 'height' ) );
        var width = parseFloat( this.proxy.getStyle( 'width' ) || 0 ) + pad;

        // constrain the size with the min_ and max_width options
        [ 'max', 'min' ].each( function( m ) {
            var v = this.options.get( m + '_width' );

            if( typeof v == 'number' && isFinite( v ) ) {
                width = Math[ m == 'max' ? 'min' : 'max' ]( v, width );
            }
        }.bind( this ) );

        this.input.setStyle( { width: width + 'px' } );
    }
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

/**
 * Initialize the tagboxes when the DOM is ready
 */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
