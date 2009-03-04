document.observe( 'dom:loaded', function() {

    if( window['Tagbox'] == undefined ) {
        $$( 'body' ).first().insert( { top: new Element( 'div', { id: 'error' } ).insert(
            new Element( 'h1' ).update( "The demo is broken!" )
        ).insert(
            new Element( 'p' ).update( "<code>tagbox.js</code> isn't where it should be." )
        ).insert(
            new Element( 'p' ).update(
                "If you checked out the source using the `git clone` command, " +
                "you need to build the source, and then try the demo again."
            )
        ) } );
    }

    // add the value containers
    $$( 'button' ).each( function( button ) {
        button.insert( { after: new Element( 'div', { 'class': 'value' } ) } );
    } );

    // hook up the "get value" buttons
    $$( 'button' ).invoke( 'observe', 'click', function( e ) {
        var wrapper_el = Event.element( e ).up( '.input-wrapper' );
        var value_el = wrapper_el.down( '.value' );

        value_el.update(
            Tagbox.values( wrapper_el.down( '.tagbox' ) ).join( ', ' ).escapeHTML() || '(no value)'
        );
    } );

    // display the tagbox version
    $$( '.version' ).each( function( el ) {
        el.update( 'v' + Tagbox.version );
    } );
} );
