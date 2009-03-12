/**
 * class Tagbox.Tag
 **/
Tagbox.Tag = Class.create( {
    /**
     * Tagbox.Tag#properties -> Hash
     *
     * A Hash of public properties for this Tagbox.Tag instance.  Properties
     * are:
     *
     *  label (String): The value which will be displayed to the user.
     *  field_name (String): The name of the hidden form field for this tag.
     *  payload (Variant): Arbitrary data to associate with this tag.
     *  value (String): The value with which be submitted to the server when
     *     the parent form is submitted.
     **/
    properties: {
        label: null,
        field_name: null,
        payload: null,
        value: null
    },

    /**
     * Tagbox.Tag#tagbox -> Tagbox
     *
     * The parent Tagbox.
     **/
    tagbox: null,

    /**
     * new Tagbox.Tag( properties )
     *   - tagbox (Tagbox): The parent tagbox.
     *   - properties (Object): Properties for this Tagbox.Tag.
     **/
    initialize: function( tagbox, properties ) {
        this.tagbox = tagbox;
        this.properties = new Hash( this.properties );
        this.properties.set( 'field_name', tagbox.name );

        if( typeof properties == "string" ) {
            properties = { value: properties };
        }

        this.properties.update( properties );
    },

    /**
     * Tagbox.Tag#render() -> Element
     *
     * Create the tag's HTML representation.
     **/
    render: function() {
        var wrapper = new Element( 'li', { 'class': 'tagbox-tag' } );

        // the hidden input which represents this tag in the form
        var input = new Element( 'input', {
            type: 'hidden',
            name: this.properties.get( 'field_name' ) + '[]',
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

    /**
     * Tagbox.Tag#getLabel() -> String
     *
     * Get the Tag's label.
     **/
    getLabel: function() {
        return this.properties.get( 'label' ) ? this.properties.get( 'label' ) :
            this.properties.get( 'value' );
    },

    /**
     * Tagbox.Tag#getPayload() -> Variant
     *
     * Get the Tag's payload.
     **/
    getPayload: function() {
        return this.properties.get( 'payload' );
    },

    /**
     * Tagbox.Tag#getValue() -> String
     *
     * Get the Tag's value.
     **/
    getValue: function() {
        return this.properties.get( 'value' );
    }
} );