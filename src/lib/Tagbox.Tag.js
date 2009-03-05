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
     *  value (String): the tag's displayed value
     **/
    properties: {
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
        this.properties.update( properties );
    },

    /**
     * Tagbox.Tag#getElement() -> Element
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
     * Tagbox.Tag#getValue() -> String
     *
     * Get the Tag's value.
     **/
    getValue: function() {
        return this.properties.get( 'value' );
    }
} );