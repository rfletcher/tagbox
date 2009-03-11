/*
 * Tagbox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @link http://github.com/rfletcher/tagbox
 * @version 0.1+
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Tagbox was heavily inspired Guillermo Rauch's TextboxList.
 * Portions retain his copyright.
 */

Object.extend( Event, {
    KEY_COMMA: 44,
    KEY_SEMICOLON: 59,
    KEY_SPACE: 32
} );

Object.extend( Form.Element.Methods, {
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
var ElasticTextBox = Class.create( {
    options: {
        max_width: null,
        min_width: 20
    },

    input: null,

    proxy: null,

    initialize: function( input ) {
        this.options = new Hash( this.options );
        this.input = $( input );

        this.registerEventHandlers( this.input );
        this.createProxy();
        this.updateWidth();
    },

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

    registerEventHandlers: function() {
        this.input.observe( 'keypress', this.updateWidth.bind( this ) );
        this.input.observe( 'keyup', this.updateWidth.bind( this ) );
    },

    updateWidth: function() {
        this.proxy.innerHTML = this.input.value.escapeHTML();

        var pad = parseFloat( this.input.getStyle( 'height' ) );
        var width = parseFloat( this.proxy.getStyle( 'width' ) || 0 ) + pad;

        [ 'max', 'min' ].each( function( m ) {
            var v = this.options.get( m + '_width' );

            if( typeof v == 'number' && isFinite( v ) ) {
                width = Math[ m == 'max' ? 'min' : 'max' ]( v, width );
            }
        }.bind( this ) );

        this.input.setStyle( { width: width + 'px' } );
    }
} );
var Tagbox = Class.create( {
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

    autocomplete: null,

    current: null,

    hint_timeout: null,

    name: null,

    tagbox: null,

    tags: null,

    initialize: function( original_input, options ) {
        this.options = new Hash( this.options ).update( options );
        this.tags = [];
        this.name = $( original_input ).getAttribute( 'name' );

        this.initializeAllowedTags();
        this.insert( original_input );

        if( this.options.get( 'autocomplete' ) && this.options.get( 'allowed' ).length ) {
            this.autocomplete = new Tagbox.Autocomplete( this );
        }

        this.registerEventHandlers();
    },

    fire: function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },
    observe: function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },
    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

    addTag: function( label ) {
        if( ! ( label instanceof Tagbox.Tag ) ) {
            label = label.replace( /^\s+/, '' ).replace( /\s+$/, '' );
        }

        if( ! label ) {
            return;

        } else if( typeof this.options.get( 'max_tags' ) == "number" && this.tags.length >= this.options.get( 'max_tags' ) ) {
            return;

        } else if( ! this.options.get( 'allow_duplicates' ) && this.findTagByLabel( label instanceof Tagbox.Tag ? label.getLabel() : label ) ) {
            return;

        } else if( typeof this.options.get( 'validation_function' ) == "function" && ! this.options.get( 'validation_function' )( label.getlabel ? label.getlabel() : label ) ) {
            return;
        }

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

        ( this.current || this.tagbox.select( 'ul.tagbox-tags li' ).last() ).insert( { before: tag_el } );
    },

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

    createInput: function( attributes ) {
        var input = new Element( 'input', $H( attributes ).update( { type: 'text' } ).toObject() );
        this.registerInputEventHandlers( input );

        var li = new Element( 'li' ).insert( input );
        new ElasticTextBox( input );

        return li;
    },

    currentIsInput: function() {
        return Boolean( this.current && ! this.current.hasClassName( 'tagbox-tag' ) && this.current.down( 'input' ) );
    },

    currentIsTag: function() {
        return Boolean( this.current && this.current.hasClassName( 'tagbox-tag' ) );
    },

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

    findTagByLabel: function( label ) {
        return this.findTagBy( 'label', label );
    },

    findTagByValue: function( value ) {
        return this.findTagBy( 'value', value );
    },

    focus: function( element, update_input_focus ) {
        if( element && element.hasClassName( 'tagbox-selected' ) ) {
            return;
        }

        var had_focus = this.hasFocus();

        this.blur( update_input_focus );

        if( ! element ) {
            this.tagbox.removeClassName( 'tagbox-selected' );
        } else if( element.parentNode == this.tagbox.down( 'ul.tagbox-tags' ) ) {
            [ this.tagbox, element ].invoke( 'addClassName', 'tagbox-selected' );

            this.current = element;

            if( this.currentIsInput() && update_input_focus != false ) {
                this.focusInput();
            }
        }

        if( had_focus && ! this.hasFocus() ) {
            this.fire( 'tagbox:blur' );
        } else if( ! had_focus && this.hasFocus() ) {
            this.fire( 'tagbox:focus' );
        }
    },

    focusInput: function() {
        ( function() {
            this.tagbox.select( '.tagbox-tags li' ).last().down( 'input[type=text]' ).focus();
            this.fire( 'tagbox:text:focus' );
        }.bind( this ) ).defer();
    },

    hasFocus: function() {
        return this.tagbox.hasClassName( 'tagbox-selected' );
    },

    hideHint: function() {
        clearTimeout( this.hint_timeout );
        el = this.tagbox.down( '.tagbox-hint' );
        el && el.hide();
    },

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

    insert: function( original_input ) {
        this.tagbox = new Element( 'div', { 'class': 'tagbox' } ).update(
            new Element( 'ul', { 'class': 'tagbox-tags' } ).update( this.createInput() )
        );

        var delimiters = this.options.get( 'delimiters' ).collect( function( v ) {
            var hex = v.toString( 16 );
            return "\\x" + ( hex.length == 1 ? "0" : "" ) + hex;
        } ).join();

        $( original_input ).value.split( new RegExp( '[' + delimiters + ']' ) ).each( this.addTag.bind( this ) );

        $( original_input ).replace( this.tagbox );
    },

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
                var i = new_el.down( 'input' ), v = i.value;
                i.value += ' ';
                i.value = v;
            }
        }
    },

    registerCustomEventHandlers: function() {
        this.observe( 'tagbox:text:blur', this.hideHint.bind( this ) );
        this.observe( 'tagbox:text:focus', this.showHint.bind( this ) );
    },

    registerEventHandlers: function() {
        this.registerMouseEventHandlers();
        this.registerKeyEventHandlers();
        this.registerCustomEventHandlers();
    },

    registerKeyEventHandlers: function() {
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

    registerMouseEventHandlers: function() {
        document.observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            var el = Event.element( e );

            if( el == this.tagbox || el.descendantOf( this.tagbox ) ) {
                this.focusInput();

            } else {
                this.focus( false );
            }
        }.bind( this ) );
    },

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

    remove: function() {
        if( ! this.currentIsTag() ) {
            return;
        }

        this.tags = this.tags.without( this.findTagByValue( this.current.down( 'input' ).value ) );

        var tag_el = this.current;
        this.focus( this.current.next() );
        tag_el.remove();
    },

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

    values: function() {
        return Tagbox.values( this.tagbox );
    }
} );

Tagbox.values = function( el ) {
    return $( el ).select( 'li.tagbox-tag input[type=hidden]' ).collect( function( el ) {
        return el.value;
    } );
}

Tagbox.makeFullWidth = function( element ) {
    var width = [
        'padding-left', 'padding-right',
        'border-left-width', 'border-right-width'
    ].inject( parseInt( element.getStyle( 'width' ) ), function( acc, n ) {
        return acc - parseInt( element.getStyle( n ) );
    } );

    element.setStyle( { width: width + 'px' } );
}

Tagbox.version = "0.1+";
Tagbox.Tag = Class.create( {
    properties: {
        label: null,
        value: null
    },

    tagbox: null,

    initialize: function( tagbox, properties ) {
        this.tagbox = tagbox;
        this.properties = new Hash( this.properties );

        if( typeof properties == "string" ) {
            properties = { value: properties };
        }

        this.properties.update( properties );
    },

    render: function() {
        var wrapper = new Element( 'li', { 'class': 'tagbox-tag' } );

        var input = new Element( 'input', {
            type: 'hidden',
            name: this.tagbox.name + '[]',
            value: this.getValue()
        } );

        wrapper.insert( this.getLabel().escapeHTML() ).insert( input );

        if( this.tagbox.options.get( 'show_remove_links' ) ) {
            var a = new Element( 'a', { 'class': 'tagbox-remove' } ).update( 'Remove' );
            a.observe( 'click', this.tagbox.remove.bind( this.tagbox ) );
            wrapper.insert( a );
        }

        return wrapper;
    },

    getLabel: function() {
        return this.properties.get( 'label' ) ? this.properties.get( 'label' ) :
            this.properties.get( 'value' );
    },

    getValue: function() {
        return this.properties.get( 'value' );
    }
} );
Tagbox.Autocomplete = Class.create( {
    options: {
        display_on_down_arrow: true,
        max_displayed_tags: 6
    },

    element: null,

    tagbox: null,

    query: null,
    regexp: null,
    results: [],

    initialize: function( tagbox, options ) {
        this.tagbox = tagbox;

        this.options = new Hash( this.options );
        this.options.update( options );

        this.insert();
        this.registerEventHandlers();
    },

    hide: function() {
        this.results = [];
        this.query = null;
        this.regexp = null;
        this.element.hide();
    },

    highlight: function( tag_element ) {
        var cls = 'tagbox-selected';
        var current = this.element.down( '.' + cls );

        if( current && tag_element != current ) {
            current.removeClassName( cls );
        }
        if( tag_element && tag_element != current ) {
            tag_element.addClassName( cls );
        }
    },

    insert: function() {
        this.element = new Element( 'ul', { 'class': 'tagbox-autocomplete' } );
        this.tagbox.tagbox.insert( this.element );
        Tagbox.makeFullWidth( this.element );
        this.element.setStyle( { display: 'none' } );
    },

    previous: function() {
        var current = this.element.select( '.tagbox-selected' ).last();

        if( current && current.previous() ) {
            return this.highlight( current.previous() );
        }
    },

    next: function() {
        var current = this.element.down( '.tagbox-selected' );

        if( ! current ) {
            var next = this.element.down( 'li' );
        } else if( current.next() ) {
            var next = current.next();
        } else {
            var next = current;
        }

        return this.highlight( next );
    },

    registerEventHandlers: function() {
        document.observe( Prototype.Browser.Gecko ? 'keypress' : 'keydown', function( e ) {
            if( ! this.tagbox.currentIsInput() ) {
                return;
            }

            switch( e.which ? e.which : e.keyCode ) {
                case Event.KEY_DOWN:
                    if( ! this.element.visible() && this.options.get( 'display_on_down_arrow' ) ) {
                        this.show();
                    }
                    this.next();
                    break;
                case Event.KEY_UP:
                    this.previous();
                    break;
                case Event.KEY_ESC:
                    if( this.element.visible() ) {
                        this.hide();
                    }
                    break;
                case Event.KEY_RETURN:
                    if( this.element.visible() ) {
                        this.select();
                    }
                    break;
            }
        }.bind( this ) );

        document.observe( 'keyup', function( e ) {
            if( ! this.tagbox.currentIsInput() ) {
                return;
            }

            var query = this.tagbox.current.down( 'input[type=text]' ).value .replace( /(^\s+|\s+$)/g, '' ).toLowerCase();
            if( query.length > 0 && query != this.query ) {
                this.query = query;

                this.regexp = new RegExp( '(' + this.query.split( '' ).collect( function( c ) {
                    var hex = c.charCodeAt( 0 ).toString( 16 );
                    return "\\x" + ( hex.length == 1 ? "0" : "" ) + hex;
                } ).join( '' ) + ')', 'gi' );

                this.show();
                this.next();
            }
        }.bind( this ) );

        this.tagbox.observe( 'tagbox:text:blur', this.hide.bind( this ) );
    },

    registerTagEventHandlers: function( tag_element ) {
        tag_element.observe( 'click', function() {
            this.select();
        }.bind( this ) ).observe( 'mouseover', function( e ) {
            if( e.element().up() == this.element ) {
                this.highlight( e.element() );
            }
        }.bind( this ) );
    },

    renderTag: function( tag, query_regexp ) {
        return tag.getLabel().replace( query_regexp, "<em>$1</em>" );
    },

    select: function() {
        var index = 0;
        this.element.select( 'li' ).each( function( li ) {
            if( li.hasClassName( 'tagbox-selected' ) ) {
                throw $break;
            }
            index++;
        } );

        this.tagbox.current.down( 'input[type=text]' ).value = '';

        this.tagbox.addTag( this.results[index] );
        this.hide();
    },

    show: function() {
        this.update();
        this.results.length && this.element.show();
    },

    update: function() {
        this.element.update();

        var counter = 0;

        this.results = this.tagbox.options.get( 'allowed' ).select( function( tag ) {
            if( counter > this.options.get( 'max_displayed_tags' ) ) {
                throw $break;
            }

            return tag.getLabel().toLowerCase().match( this.regexp ) && ++counter;
        }.bind( this ) );

        this.results.each( function( tag ) {
            var li = new Element( 'li', { 'class': 'tagbox-tag' } ).update(
                this.renderTag( tag, this.regexp )
            );

            this.registerTagEventHandlers( li );
            this.element.insert( li );
        }.bind( this ) );
    }
} );

/* Initialize the tagboxes when the DOM is ready */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new Tagbox( el ); } );
} );
