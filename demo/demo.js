document.observe( 'dom:loaded', function() {

    // add the value containers
    $$( 'button' ).each( function( button ) {
        button.insert( { after: new Element( 'div', { 'class': 'value' } ) } );
    } );

    // hook up the "get value" buttons
    $$( 'button' ).invoke( 'observe', 'click', function( e ) {
        var wrapper_el = Event.element( e ).up( '.input-wrapper' );
        var value_el = wrapper_el.down( '.value' );

        value_el.update(
            TagBox.values( wrapper_el.down( '.tagbox' ) ).join( ', ' ).escapeHTML() || '(no value)'
        );
    } );

} );
