/**
 * class Tagbox.Autocomplete
 **/
Tagbox.Autocomplete = Class.create( {
    /**
     * Tagbox.Autocomplete#options -> Hash
     *
     * A Hash of options for this Tagbox.Autocomplete instance. Properties
     * are:
     *
     * display_on_down_arrow (Boolean) = true:
     *     Display the unfiltered list of tags when the user presses the down
     *     arrow and the text input is empty.
     * max_displayed_tags (Boolean) = 10:
     *     
     **/
    options: {
        display_on_down_arrow: true,
        max_displayed_tags: 6
    },

    /**
     * Tagbox.Autocomplete#element -> Element
     *
     * The autocomplete HTML element
     **/
    element: null,

    /**
     * Tagbox.Autocomplete#tagbox -> Tagbox
     *
     * The parent Tagbox.
     **/
    tagbox: null,

    query: null,
    regexp: null,

    /**
     * new Tagbox.Autocomplete( tagbox, options )
     *   - tagbox (Tagbox): The parent tagbox.
     *   - options (Object): Options for this Tagbox.Autocomplete.
     **/
    initialize: function( tagbox, options ) {
        this.tagbox = tagbox;

        this.options = new Hash( this.options );
        this.options.update( options );

        this.insert();
        this.registerEventHandlers();
    },

    /**
     * Tagbox.Autocomplete#hide() -> undefined
     *
     * Hide the list.
     **/
    hide: function() {
        this.element.hide();
    },

    /**
     * Tagbox.Autocomplete#highlight( tag ) -> undefined
     *   - tag (Element): A list item to select
     *
     * Highlight a tag in the list.
     **/
    highlight: function( tag ) {
        var cls = 'tagbox-selected';
        var current = this.element.down( '.' + cls );

        if( current && tag != current ) {
            current.removeClassName( cls );
        }
        if( tag && tag != current ) {
            tag.addClassName( cls );
        }
    },

    /**
     * Tagbox.Autocomplete#insert() -> undefined
     *
     * Insert the autocomplete markup into the tagbox.
     **/
    insert: function() {
        this.element = new Element( 'ul', { 'class': 'tagbox-autocomplete' } );
        this.tagbox.tagbox.insert( this.element );
        Tagbox.makeFullWidth( this.element );
        this.element.setStyle( { display: 'none' } );
    },

    /**
     * Tagbox.Autocomplete#previous() -> undefined
     *
     * Highlight the previous tag in the list.
     **/
    previous: function() {
        var current = this.element.select( '.tagbox-selected' ).last();

        if( current && current.previous() ) {
            return this.highlight( current.previous() );
        }
    },

    /**
     * Tagbox.Autocomplete#next() -> undefined
     *
     * Highlight the next tag in the list, or the first if none are selected.
     **/
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

    /**
     * Tagbox.Autocomplete#registerEventHandlers() -> undefined
     *
     * Add event handlers to the Tagbox to show/hide the autocomplete list.
     **/
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

        // hide the autocomplete list when the tagbox loses focus
        this.tagbox.observe( 'tagbox:text:blur', this.hide.bind( this ) );
    },

    /**
     * Tagbox.Autocomplete#renderTag( tag ) -> Element
     *   - tag (Tagbox.Tag): 
     *
     * 
     **/
    renderTag: function( tag, query_regexp ) {
        return tag.getValue().replace( query_regexp, "<em>$1</em>" );
    },

    /**
     * Tagbox.Autocomplete#show() -> undefined
     *
     * Display the autocomplete list.
     **/
    show: function() {
        this.update();
        this.element.show();
    },

    /**
     * Tagbox.Autocomplete#update() -> undefined
     *
     * Update the list of tags.
     **/
    update: function() {
        this.element.update();

        var counter = 0;

        // filter
        this.tagbox.options.get( 'allowed' ).select( function( tag ) {
            if( counter > this.options.get( 'max_displayed_tags' ) ) {
                throw $break;
            }

            return tag.getValue().toLowerCase().match( this.regexp ) && ++counter;
        // add to result list
        }.bind( this ) ).each( function( tag ) {
            this.element.insert( new Element( 'li', { 'class': 'tagbox-tag' } ).update(
                this.renderTag( tag, this.regexp )
            ) );
        }.bind( this ) );
    }
} );