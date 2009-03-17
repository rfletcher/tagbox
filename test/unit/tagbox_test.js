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

    createTagbox: function( tagbox_opts ) {
        return new Tagbox( 'tagbox', tagbox_opts );
    },

    createTagboxWithTags: function( how_many, tagbox_opts ) {
        var tb = createTagbox( tagbox_opts );

        ( how_many ).times( function() {
            tb.addTag( 'tag-' + getUniqueString() );
        } );

        return tb;
    },

    getUniqueString: function() {
        return ( Math.random() * Math.pow( 10, 8 ) ).floor().toString();
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

    /* tagbox init */

    testTagboxPopulatedByInputValue: function() {
        // build a set of values
        var values = $R( 1, 5 ).inject( [], function( arr, value, index ) {
            arr.push( index + '-' + getUniqueString() );
            return arr;
        } );

        // add a few values to the text input
        $('wrapper').down('input').value = values.join( ',' );

        // compare serialized list of object's values to original list
        this.assertEqual( values.inspect(), createTagbox().values().inspect() );
    },

    testTagboxTagInputNamesDerivedFromTextInput: function() {
        // set the original input's name
        var name = 'el_' + getUniqueString();
        createInput( { name: name } );

        // convert it to a tagbox
        var tb = createTagboxWithTags( 1 );

        // compare the tag's input name with that of the original input
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
    },

    /* option: show_remove_links */

    testClickingOnRemoveLinkRemovesTag: function() {
        var tb = createTagboxWithTags( 3, { show_remove_links: true } );
        var tag_value = tb.tags[1].getValue();
        var tag_el = tb.element.select( '.tagbox-tags .tagbox-tag' )[1];
        var close_el = tag_el.down( '.tagbox-remove' );

        this.assert( tb.values().length == 3 );
        this.assert( tb.values().include( tag_value ) );
        this.assert( tb.element.select( '.tagbox-tag' ).length == 3 );

        // need to set the tagbox as active
        tb.focus( tag_el );
        Event.simulateMouse( close_el, 'click' );

        this.assert( tb.values().length == 2 );
        this.assert( ! tb.values().include( tag_value ) );
        this.assert( tb.element.select( '.tagbox-tag' ).length == 2 );
    },

    testDisablingRemoveLinksOptionHidesLinks: function() {
        var tb = createTagboxWithTags( 3, { show_remove_links: false } );
        this.assert( ! tb.element.down( '.tagbox-remove' ) );
    },

    testEnablingRemoveLinksOptionAddsLinks: function() {
        var tb = createTagboxWithTags( 3, { show_remove_links: true } );
        this.assert( tb.element.down( '.tagbox-remove' ) );
    }
});

// inject helper methods into current scope
Object.extend( this, helpers );
