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
    results: [],

    /**
     * new Tagbox.Autocomplete( tagbox, options )
     *   - tagbox (Tagbox): The parent tagbox.
     *   - options (Object): Options for this Tagbox.Autocomplete.
     **/
    initialize: function( tagbox, options ) {
        this.tagbox = tagbox;

        this.options = new Hash( this.options );
        this.options.update( options );

        // Override Tagbox.getInputValue() to return a Tagbox.Tag for the 
        // currently selected tag (instead of the string value).
        this.tagbox.getInputValue = this.tagbox.getInputValue.wrap( function( original ) {
            if( ! this.results.length ) {
                return original();
            } else {
                return this.getSelectedTag();
            }
        }.bind( this ) );

        this.insert();
        this.registerEventHandlers();
    },

    /**
     *
     **/
    getSelectedTag: function() {
        if( ! this.element.visible() || ! this.element.down( 'li.tagbox-selected' ) ) {
            return false;
        }

        // get the index of the selected <li/>
        var index = 0;
        this.element.select( 'li' ).each( function( li ) {
            if( li.hasClassName( 'tagbox-selected' ) ) {
                throw $break;
            }
            index++;
        } );

        return this.results[index];
    },

    /**
     * Tagbox.Autocomplete#hide() -> undefined
     *
     * Hide the list.
     **/
    hide: function() {
        this.results = [];
        this.query = null;
        this.regexp = null;
        this.element.hide();
    },

    /**
     * Tagbox.Autocomplete#highlight( tag_element ) -> undefined
     *   - tag_element (Element): A list item to select
     *
     * Highlight a tag in the results list.
     **/
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

        if( current ) {
            var target = current;

            do {
                target = target.previous();
            } while( target && target.hasClassName( 'tagbox-disabled' ) );
        }

        if( target ) {
            return this.highlight( target );
        }
    },

    /**
     * Tagbox.Autocomplete#next() -> undefined
     *
     * Highlight the next tag in the list, or the first if none are selected.
     **/
    next: function() {
        var candidates = this.element.down( '.tagbox-selected' ) ?
            this.element.select( '.tagbox-selected ~ li' ) :
            this.element.childElements();

        var target = candidates.find( function( el ) {
            return ! el.hasClassName( 'tagbox-disabled' );
        } );

        if( target ) {
            return this.highlight( target );
        }
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
        }.bind( this ) ).observe( 'keyup', function( e ) {
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

        // hide the autocomplete list when the tagbox text input loses focus
        this.tagbox.observe( 'tagbox:text:blur', this.hide.bind( this ) );
        this.tagbox.observe( 'tagbox:tagged', this.hide.bind( this ) );
    },

    /**
     * Tagbox.Autocomplete#registerTagEventHandlers() -> undefined
     *
     * Register event handlers for the rendered tag elements in the drop-down list.
     **/
    registerTagEventHandlers: function( tag_element ) {
        tag_element.observe( 'click', function() {
            this.select();
        }.bind( this ) ).observe( 'mouseover', function( e ) {
            if( e.element().up() == this.element ) {
                this.highlight( e.element() );
            }
        }.bind( this ) );
    },

    /**
     * Tagbox.Autocomplet#select() -> undefined
     *
     * Add a tag to the tagbox and hide the results list.
     **/
    select: function() {
        this.tagbox.addTagFromInput();
        this.hide();
    },

    /**
     * Tagbox.Autocomplete#show() -> undefined
     *
     * Display the autocomplete list.
     **/
    show: function() {
        this.update();
        this.results.length && this.element.show();
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
        this.results = this.tagbox.options.get( 'allowed' ).select( function( tag ) {
            if( counter > this.options.get( 'max_displayed_tags' ) ) {
                throw $break;
            }

            return tag.getLabel().toLowerCase().match( this.regexp ) && ++counter;
        }.bind( this ) );

        // add to result list
        this.results.each( function( tag ) {
            var disabled = ! this.tagbox.options.get( 'allow_duplicates' ) && this.tagbox.tags.include( tag );

            var li = new Element( 'li', { 'class': 'tagbox-tag' } ).update(
                this.tagbox.options.get( 'autocomplete_tag_renderer' )( tag, this.regexp, disabled )
            );

            if( disabled ) {
                li.addClassName( 'tagbox-disabled' );
            } else {
                this.registerTagEventHandlers( li );
            }

            this.element.insert( li );
        }.bind( this ) );
    }
} );

/**
 * Tagbox.Autocomplete.renderTag( tag, query_regexp, disabled ) -> Element
 *   - tag (Tagbox.Tag): The Tagbox.Tag object to render as HTML.
 *   - query_regexp (RegExp ): A regular expression representation of the
 *     user's input string.
 *   - disabled (Boolean): This entry is disabled due to a restriction on
 *     duplicates
 *
 * Generate an HTML representation of a Tagbox.Tag object for display
 * in the results list.
 **/
Tagbox.Autocomplete.renderTag = function( tag, query_regexp, disabled ) {
    return tag.getLabel().replace( query_regexp, "<em>$1</em>" );
}
