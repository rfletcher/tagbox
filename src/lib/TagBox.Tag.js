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
     **/
    getValue: function() {
        return this.properties.get( 'value' );
    }
} );