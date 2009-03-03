/**
 * class ElasticTextBox
 *
 * Extends text <input/> elements to automatically resize based on the width
 * of their value.
 **/
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
     * ElasticTextBox#createProxy() -> undefined
     *
     * Create the proxy element and insert it into the DOM.
     **/
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
     * ElasticTextBox#registerEventHandlers() -> undefined
     *
     * Register input element event handlers.
     **/
    registerEventHandlers: function() {
        this.input.observe( 'keypress', this.updateWidth.bind( this ) );
        this.input.observe( 'keyup', this.updateWidth.bind( this ) );
    },

    /**
     * ElasticTextBox#updateWidth() -> undefined
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