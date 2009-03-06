/**
 * class Tagbox
 *
 * An unobtrusive, multi-value text input.
 *
 * fires tagbox:blur, tagbox:focus
 **/
var Tagbox = Class.create( {
    /**
     * Tagbox#options -> Hash
     *
     * A Hash of options for this Tagbox instance.  Options are:
     *
     *  allowed: (Array) = []:
     *      The set of allowed input values.  Values can be specified in any
     *      format acceptable to the Tagbox.Tags constructor.
     *  allow_duplicates (Boolean) = false:
     *      Allow duplicate tags?
     *  autocomplete (Boolean) = true:
     *      Display a drop-down list of allowed values, filtered as the user 
     *      types. This option has no effect when the ``allowed`` array is empty.
     *  case_sensitive (Boolean) = false:
     *      Use case sensitive string comparison when checking for duplicate
     *      and/or permitted tags.
     *  delimiters (Array) = [ Event.KEY_COMMA, Event.KEY_RETURN ]:
     *      Array of keyCodes which trigger addition to the list of tags.
     *  hint (String) = null:
     *      A brief instruction to the user.
     *  hint_delay (Number) = 100:
     *      The number of milliseconds to wait after tagbox:text:focus before
     *      showing the hint.
     *  max_tags (Number) = null:
     *      The maximum number of tags that can be entered.
     *  show_remove_links (Boolean) = false:
     *      Add an 'x' link to each tag.
     *  validation_function (Function | null) = null:
     *      A function which validates new input before adding it as a tag.
     *      It will be passed the String value as the only parameter, and 
     *      should return a Boolean.
     **/
    options: {
        allowed: [],
        allow_duplicates: false,
        autocomplete: true,
        case_sensitive: false,
        hint: null,
        hint_delay: 100,
        delimiters: [ Event.KEY_COMMA, Event.KEY_RETURN ],
        max_tags: null,
        show_remove_links: true,
        validation_function: null
    },

    /**
     * Tagbox#autocomplete -> Tagbox.Autocomplete
     * A reference to this Tagbox's Autocomplete object
     **/
    autocomplete: null,

    /**
     * Tagbox#current -> ( null | Element )
     * The <li/> with the focus.
     **/
    current: null,

    /**
     * Tagbox#hint_timeout -> Number
     * A timeout ID from window.setTimeout()
     **/
    hint_timeout: null,

    /**
     * Tagbox#name -> String
     * The form field name, taken from the original input element.
     **/
    name: null,

    /**
     * Tagbox#tagbox -> Element
     * The tagbox (<div/>) element.
     **/
    tagbox: null,

    /**
     * Tagbox#tags -> [ Tagbox.Tag... ]
     * An `Array` of `Tagbox.Tag` objects.
     **/
    tags: null,

    /**
     * new Tagbox( originalinput[, options ] )
     *   - originalinput (Element | String): The original text input, or a
     *     string that references the input's ID.
     *   - options (Object): Options for this Tagbox.
     **/
    initialize: function( original_input, options ) {
        this.options = new Hash( this.options ).update( options );
        this.tags = [];
        this.name = $( original_input ).getAttribute( 'name' );

        this.initializeAllowedTags();
        this.insert( original_input );

        if( this.options.get( 'autocomplete' ) && this.options.get( 'allowed' ) ) {
            this.autocomplete = new Tagbox.Autocomplete( this );
        }

        this.registerEventHandlers();
    },

    /**
     * Tagbox#fire() -> undefined
     * See: Prototype.js Element#fire()
     **/
    fire: function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },
    /**
     * Tagbox#observe() -> undefined
     * See: Prototype.js Element#observe()
     **/
    observe: function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },
    /**
     * Tagbox#stopObserving() -> undefined
     * See: Prototype.js Element#stopObserving()
     **/
    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

    /**
     * Tagbox#addTag( label ) -> undefined
     *   - label (String | Tagbox.Tag): A tag label, or a Tagbox.tag object
     *
     * Add a tag to the list.
     **/
    addTag: function( label ) {
        if( ! ( label instanceof Tagbox.Tag ) ) {
            label = label.replace( /^\s+/, '' ).replace( /\s+$/, '' );
        }

        // no label?
        if( ! label ) {
            return;

        // too many tags?
        } else if( typeof this.options.get( 'max_tags' ) == "number" && this.tags.length >= this.options.get( 'max_tags' ) ) {
            return;

        // duplicate tag?
        } else if( ! this.options.get( 'allow_duplicates' ) && this.findTagByLabel( label instanceof Tagbox.Tag ? label.getLabel() : label ) ) {
            return;

        // failed user's validation callback?
        } else if( typeof this.options.get( 'validation_function' ) == "function" && ! this.options.get( 'validation_function' )( label.getlabel ? label.getlabel() : label ) ) {
            return;
        }

        // if the list of possible tags is restricted, search for the entered tag
        if( this.options.get( 'allowed' ).length ) {
            var tag = this.options.get( 'allowed' ).find( function( tag ) {
                if( label instanceof Tagbox.Tag ) {
                    return tag == label;
                } else {
                    return tag.getLabel().toLowerCase() == label.toLowerCase();
                }
            } );

            if( ! tag ) {
                return;
            }
        } else if( label instanceof Tagbox.Tag ) {
            var tag = label;
        } else {
            var tag = new Tagbox.Tag( this, label );
        }

        this.tags.push( tag );

        var tag_el = tag.render().observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            e.stop();
            this.focus( tag_el );
        }.bind( this ) );

        // insert the new tag into the HTML list
        ( this.current || this.tagbox.select( 'ul.tagbox-tags li' ).last() ).insert( { before: tag_el } );
    },

    /**
     * Tagbox#blur( [ updateinputfocus = true ] ) -> undefined
     *   - updateinputfocus (Boolean): Call the descendant input's native
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
            if( this.currentIsInput() ) {
                this.fire( 'tagbox:text:blur' );
            }
            this.current = null;
        }
    },

    /**
     * Tagbox#createInput( [ attributes ] ) -> Element
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
     * Tagbox#currentIsInput() -> Boolean
     *
     * Test whether the current node is an input node.
     **/
    currentIsInput: function() {
        return Boolean( this.current && ! this.current.hasClassName( 'tagbox-tag' ) && this.current.down( 'input' ) );
    },

     /**
      * Tagbox#currentIsTag() -> Boolean
      *
      * Test whether the current node is a tag node.
      **/
    currentIsTag: function() {
        return Boolean( this.current && this.current.hasClassName( 'tagbox-tag' ) );
    },

    /**
     * Tagbox#findTagBy( property, value ) -> Tagbox.Tag
     *      - property (String): The name of the property to compare. ("label", or "value")
     *      - value (String): A value to find.
     *
     * Find a tag object by label.
     **/
    findTagBy: function( property, value ) {
        if( [ 'label', 'value' ].include( property ) ) {
            return;
        }
    
        return this.tags.find( function( tag ) {
            var val1 = tag['get' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1 ).toLowerCase()]();
            console.log( val1 );
            var val2 = value;

            if( ! this.options.get( 'case_sensitive' ) ) {
                val1 = val1.toLowerCase();
                val2 = val2.toLowerCase();
            }

            return val1 == val2;
        }.bind( this ) );
    },

    /**
     * Tagbox#findTagByLabel( label ) -> Tagbox.Tag
     *      - label (String): A label to find.
     *
     * Find a tag object by label.
     **/
    findTagByLabel: function( label ) {
        return this.findTagBy( 'label', label );
    },

    /**
     * Tagbox#findTagByValue( value ) -> Tagbox.Tag
     *      - value (String): A value to find.
     *
     * Find a tag object by value.
     **/
    findTagByValue: function( value ) {
        return this.findTagBy( 'value', value );
    },

    /**
     * Tagbox#focus( [ element[, updateinputfocus ]] ) -> undefined
     *   - element (Element): The <li/> element to select.
     *   - update_input_focus (Boolean): Call the descendant input's native
     *     blur() method.
     *
     * Set the focus on a tag or input <li/>, or remove focus from the tagbox.
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
        } else if( element.parentNode == this.tagbox.down( 'ul.tagbox-tags' ) ) {
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
     * Tagbox#focusInput() -> undefined
     *
     * Set the focus on the main tagbox text input.
     **/
    focusInput: function() {
        ( function() {
            this.tagbox.select( '.tagbox-tags li' ).last().down( 'input[type=text]' ).focus();
            this.fire( 'tagbox:text:focus' );
        }.bind( this ) ).defer();
    },

    /**
     * Tagbox#hasFocus() -> Boolean
     *
     * Test whether the tagbox has the focus.
     **/
    hasFocus: function() {
        return this.tagbox.hasClassName( 'tagbox-selected' );
    },

    /**
     * Tagbox#hideHint() -> undefined
     *
     * Hide the tagbox hint
     **/
    hideHint: function() {
        clearTimeout( this.hint_timeout );
        el = this.tagbox.down( '.tagbox-hint' );
        el && el.hide();
    },

    /**
     * Tagbox#initializeAllowedTags() -> undefined
     *
     * Convert members of the 'allowed' array to Tagbox.Tag objects, if they
     * weren't provided that way.
     **/
    initializeAllowedTags: function() {
        this.options.set( 'allowed',
            this.options.get( 'allowed' ).collect( function( tag ) {
                if( ! ( tag instanceof Tagbox.Tag ) ) {
                   return new Tagbox.Tag( this, tag );
                }
                return tag;
            }.bind( this ) )
        );
    },

    /**
     * Tagbox#insert( original_input ) -> undefined
     *   - originalinput (Element | String): The original text input, or a
     *     string that references the input's ID.
     *
     * Replace the original <input/> element with a Tagbox.
     **/
    insert: function( original_input ) {
        // create the tagbox
        this.tagbox = new Element( 'div', { 'class': 'tagbox' } ).update(
            new Element( 'ul', { 'class': 'tagbox-tags' } ).update( this.createInput() )
        );

        // populate the tagbox with tags from the original input
        var delimiters = this.options.get( 'delimiters' ).collect( function( v ) {
            var hex = v.toString( 16 );
            return "\\x" + ( hex.length == 1 ? "0" : "" ) + hex;
        } ).join();

        $( original_input ).value.split( new RegExp( '[' + delimiters + ']' ) ).each( this.addTag.bind( this ) );

        // replace the original input with the tagbox
        $( original_input ).replace( this.tagbox );
    },

    /**
     * Tagbox#move( target ) -> undefined
     *   - target ('first' | 'last' | 'previous' | 'next'): The direction to
     *     move the focus.
     *
     * Move the focus around the tagbox
     **/
    move: function( target ) {
        switch( target ) {
            case 'first':
            case 'last':
                var new_el = this.tagbox.select( 'ul.tagbox-tags li' )[target]();
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
     * Tagbox#registerCustomEventHandlers() -> undefined
     *
     * Monitor custom Tagbox events
     **/
    registerCustomEventHandlers: function() {
        this.observe( 'tagbox:text:blur', this.hideHint.bind( this ) );
        this.observe( 'tagbox:text:focus', this.showHint.bind( this ) );
    },

    /**
     * Tagbox#registerEventHandlers() -> undefined
     *
     * Register document and tagbox element event handlers.
     **/
    registerEventHandlers: function() {
        this.registerMouseEventHandlers();
        this.registerKeyEventHandlers();
        this.registerCustomEventHandlers();
    },

    /**
     * Tagbox#registerKeyEventHandlers() -> undefined
     *
     * Monitor key events to navigate or remove tags.
     **/
    registerKeyEventHandlers: function() {
        document.observe( Prototype.Browser.Gecko ? 'keypress' : 'keydown', function( e ) {
            // if the tagbox doesn't have the focus, disregard all key events
            if( ! this.hasFocus() ) {
                return;
            }

            // a little cross-browser compatibility
            var key = e.which ? e.which : e.keyCode;

            switch( key ) {
                // let the user tab out of the tagbox to next input
                case Event.KEY_TAB:
                    if( this.currentIsTag() ) {
                        this.tagbox.select( 'li' ).last().down( 'input' ).focus();
                    }
                    this.focus( false, false );
                    break;

                // move to the first or last tag
                case Event.KEY_HOME:
                    this.move( 'first' );
                    break;
                case Event.KEY_END:
                    this.move( 'last' );
                    break;

                // move to the previous or next tag
                case Event.KEY_LEFT:
                    if( this.currentIsInput() && this.current.down( 'input' ).getCaretPosition() !== 0 ) {
                        break;
                    }
                    this.move( 'previous' );
                    break;
                case Event.KEY_RIGHT:
                    this.move( 'next' );
                    break;

                // select the previous or next tag, and/or remove the selected tag
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
     * Tagbox#registerMouseEventHandlers() -> undefined
     *
     * Monitor for clicks to set or remove focus.
     **/
    registerMouseEventHandlers: function() {
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
    },

    /**
     * Tagbox#registerInputEventHandlers( input ) -> undefined
     *   - input (Element): A tagbox input element.
     *
     * Register <input/>-specific event handlers.
     **/
    registerInputEventHandlers: function( input ) {
        if( ! this.autocomplete ) {
            input.observe( 'keypress', function( e ) {
                var el = e.element();
                var key = e.which ? e.which : e.keyCode;

                if( this.options.get( 'delimiters' ).include( key ) ) {
                    e.stop();
                    this.addTag( el.value );
                    el.value = '';
                }
            }.bind( this ) );
        }

        input.observe( 'focus', function( e ) {
            this.focus( Event.element( e ).up( 'li' ) );
        }.bind( this ) );
    },

    /**
     * Tagbox#remove() -> undefined
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
     * Tagbox#showHint() -> undefined
     *
     * Show the tagbox hint to the user
     **/
    showHint: function() {
        var hint = this.options.get( 'hint' );

        if( hint && this.currentIsInput() ) {
            var hint_el = this.tagbox.down( '.tagbox-hint' );

            if( ! hint_el ) {
                hint_el = new Element( 'div', { 'class': 'tagbox-hint' } ).update( hint );
                this.tagbox.insert( hint_el );
                Tagbox.makeFullWidth( hint_el );
                hint_el.setStyle( { display: 'none' } );
            }

            this.hint_timer = setTimeout( function() {
                if( this.currentIsInput() ) {
                    hint_el.show();
                }
            }.bind( this ), this.options.get( 'hint_delay' ) );
        }
    },

    /**
     * Tagbox#values() -> [ String... ]
     *
     * Get an `Array` of tag values.
     **/
    values: function() {
        return Tagbox.values( this.tagbox );
    }
} );

/**
 * Tagbox.values( element ) -> [ String... ]
 *   - element (Element | String): A DOM ancestor of a tagbox, or a string
 *     that references the ancestor's ID.
 *
 * Get an `Array` of tag values.
 **/
Tagbox.values = function( el ) {
    return $( el ).select( 'li.tagbox-tag input[type=hidden]' ).collect( function( el ) {
        return el.value;
    } );
}

/**
 * Tagbox.makeFullWidth( element ) -> undefined
 *   - element (Element | String): An element whose width will be set
 *
 * Set an element's width to 100%, /including/ padding and border widths.
 **/
Tagbox.makeFullWidth = function( element ) {
    var width = [
        'padding-left', 'padding-right',
        'border-left-width', 'border-right-width'
    ].inject( parseInt( element.getStyle( 'width' ) ), function( acc, n ) {
        return acc - parseInt( element.getStyle( n ) );
    } );

    element.setStyle( { width: width + 'px' } );
}

/**
 * Tagbox#version -> String
 * The current version, populated by `rake dist`
 **/
Tagbox.version = "<%= TAGBOX_VERSION %>";
