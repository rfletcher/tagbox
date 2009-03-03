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
     *  validation_function (Function | null) = null:
     *      A function which validates new input before adding it as a tag.
     *      It will be passed the String value as the only parameter, and 
     *      should return a Boolean.
     **/
    options: {
        allow_duplicates: false,
        case_sensitive: false,
        delimiters: [ Event.KEY_COMMA, Event.KEY_RETURN ],
        show_remove_links: true,
        validation_function: null
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
     * new TagBox( originalinput[, options ] )
     *   - originalinput (Element | String): The original text input, or a
     *     string that references the input's ID.
     *   - options (Object): Options for this TagBox.
     **/
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
     * TagBox#fire() -> undefined
     * See: Prototype.js Element#fire()
     **/
    fire:          function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },

    /**
     * TagBox#observe() -> undefined
     * See: Prototype.js Element#observe()
     **/
    observe:       function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },

    /**
     * TagBox#stopObserving() -> undefined
     * See: Prototype.js Element#stopObserving()
     **/
    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

    /**
     * TagBox#addTag( value ) -> undefined
     *   - value (String): Displayed value of the new tag
     *
     * Add a tag to the list, and select that tag.
     **/
    addTag: function( value ) {
        value = value.replace( /^\s+/, '' ).replace( /\s+$/, '' );

        if( ! value || 
            ( ! this.options.get( 'allow_duplicates' ) && this.findTagByValue( value ) ) ||
            ( typeof this.options.get( 'validation_function' ) == "function" && ! this.options.get( 'validation_function' )( value ) ) ) {
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
     * TagBox#blur( [ updateinputfocus = true ] ) -> undefined
     *   - updateinputfocus (Boolean): Call the descendent input's native
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
     * TagBox#focus( [ element[, updateinputfocus ]] ) -> undefined
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
     * TagBox#focusInput() -> undefined
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
     * TagBox#move( target ) -> undefined
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
     * TagBox#registerEventHandlers() -> undefined
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
     * TagBox#registerInputEventHandlers( input ) -> undefined
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
     * TagBox#remove() -> undefined
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
