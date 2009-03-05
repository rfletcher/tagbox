/**
 * class Tagbox.Autocomplete.Item
 **/
Tagbox.Autocomplete.Tag = Class.create( Tagbox.Tag, {
    /**
     * Tagbox.Autocomplete.Tag#render() -> Element
     *
     * Render the autocomplete item as HTML
     **/
    render: function( query_regexp ) {
        return this.properties.get( 'value' ).replace( query_regexp, "<em>$1</em>" );
    }
} );
