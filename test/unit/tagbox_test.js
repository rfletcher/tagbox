/**
 * test helper methods
 **/
var helpers = {
    createInput: function( attributes ) {
        var el = new Element( 'input', $H( { type: 'text', id: 'tagbox' } ).merge( attributes ).toObject() );

        // insert a text input
        $('wrapper').update( el );

        return el;
    },

    createTagbox: function() {
        return new Tagbox( 'tagbox' );
    },

    resetTagbox: function() {
        resetWrapper();
        insertTagbox();
    },

    resetWrapper: function() {
        // remove any old tagbox
        $('wrapper').update();

        createInput();
    }
};

/**
 * test runner
 **/
new Test.Unit.Runner({
    setup: function() {
        resetWrapper();
    },

    testTagboxPopulatedByInputValue: function() {
        // build a set of values
        var values = $R( 1, 5 ).inject( [], function( arr, value, index ) {
            arr.push( index + '-' + ( new Date() ).getTime() );
            return arr;
        } );

        // add a few values to the text input
        $('wrapper').down('input').value = values.join( ',' );

        // compare serialied list of 
        this.assertEqual( values.inspect(), createTagbox().values().inspect() );
    },

    testTagboxTagInputNamesDerivedFromTextInput: function() {
        var name = 'el_' + ( new Date ).getTime();

        createInput( { name: name } );

        var tb = createTagbox();
        tb.addTag( 'foo' );

        this.assertEqual( tb.element.down( '.tagbox-tags input[type=hidden]' ).name, name + '[]' );
    },

    testTagboxReplacesInput: function() {
        // exactly 1 child, an input
        this.assertEqual( 1, $('wrapper').childElements().length );
        this.assertEqual( 1, $$('#wrapper > input').length );
    
        createTagbox();
    
        // exactly 1 element, not an input
        this.assertEqual( 1, $('wrapper').childElements().length );
        this.assertEqual( 0, $$('#wrapper > input').length );
    }
});

// inject helper methods into current scope
Object.extend( this, helpers );
