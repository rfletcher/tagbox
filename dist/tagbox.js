/*
 * TagBox, a multiple-value text input
 *
 * @author Rick Fletcher <fletch@pobox.com>
 * @version 0.1
 *
 * This library is distributed under an MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * TagBox was heavily inspired Guillermo Rauch's TextboxList.
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
var TagBox = Class.create( {
    options: {
        allow_duplicates: false,
        case_sensitive: false,
        delimiters: [ Event.KEY_COMMA, Event.KEY_RETURN ],
        show_remove_links: true,
        validation_function: null
    },

    current: null,

    name: null,

    tagbox: null,

    tags: null,

    initialize: function( original_input, options ) {
        this.options = new Hash( this.options ).update( options );
        this.tags = [];
        this.name = $( original_input ).getAttribute( 'name' );

        this.tagbox = new Element( 'ul', { 'class': 'tagbox' } );
        this.tagbox.insert( this.createInput() );

        var delimiters = this.options.get( 'delimiters' ).collect( function( v ) {
            var hex = v.toString( 16 );
            return "\\x" + ( hex.length == 1 ? "0" : "" ) + hex;
        } ).join();

        $( original_input ).value.split( new RegExp( '[' + delimiters + ']' ) ).each( this.addTag.bind( this ) );

        $( original_input ).replace( this.tagbox );

        this.registerEventHandlers();
    },

    fire:          function() { return this.tagbox.fire.apply( this.tagbox, arguments ); },

    observe:       function() { return this.tagbox.observe.apply( this.tagbox, arguments ); },

    stopObserving: function() { return this.tagbox.stopObserving.apply( this.tagbox, arguments ); },

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

    blur: function( update_input_focus ) {
        if( this.current ) {
            this.current.removeClassName( 'tagbox-selected' );
            if( update_input_focus !== false && this.currentIsInput() ) {
                this.current.down( 'input[type=text]' ).blur();
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

    focus: function( element, update_input_focus ) {
        if( element && element.hasClassName( 'tagbox-selected' ) ) {
            return;
        }

        var had_focus = this.hasFocus();

        this.blur( update_input_focus );

        if( ! element ) {
            this.tagbox.removeClassName( 'tagbox-selected' );
        } else if( element.parentNode == this.tagbox ) {
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
            this.tagbox.select( 'li' ).last().down( 'input[type=text]' ).focus();
        }.bind( this ) ).defer();
    },

    hasFocus: function() {
        return this.tagbox.hasClassName( 'tagbox-selected' );
    },

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
                var i = new_el.down( 'input' ), v = i.value;
                i.value += ' ';
                i.value = v;
            }
        }
    },

    registerEventHandlers: function() {
        document.observe( Prototype.Browser.IE ? 'click' : 'mousedown', function( e ) {
            var el = Event.element( e );

            if( el == this.tagbox || el.descendantOf( this.tagbox ) ) {
                this.focusInput();

            } else {
                this.focus( false );
            }
        }.bind( this ) );

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

    remove: function() {
        if( ! this.currentIsTag() ) {
            return;
        }

        this.tags = this.tags.without( this.findTagByValue( this.current.down( 'input' ).value ) );

        var tag_el = this.current;
        this.focus( this.current.next() );
        tag_el.remove();
    },

    values: function() {
        return TagBox.values( this.tagbox );
    }
} );

TagBox.values = function( el ) {
    return $( el ).select( 'li.tagbox-tag input[type=hidden]' ).collect( function( el ) {
        return el.value;
    } );
}
TagBox.Tag = Class.create( {
    properties: {
        value: null
    },

    tagbox: null,

    initialize: function( properties ) {
        this.properties = new Hash( this.properties );
        this.properties.update( properties );
    },

    getElement: function() {
        var value = this.getValue();

        var li = new Element( 'li', { 'class': 'tagbox-tag' } );

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

    getValue: function() {
        return this.properties.get( 'value' );
    }
} );
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

/* Initialize the tagboxes when the DOM is ready */
document.observe( 'dom:loaded', function() {
    $$( 'input.tagbox' ).each( function( el ) { new TagBox( el ); } );
} );
