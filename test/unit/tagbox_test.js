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

    /* keyboard handlers */

    // testTypingDelimitersAddNewTag: function() {
    //     var delimiters = [ Event.KEY_RETURN, Event.KEY_COMMA ];
    //     var tb = createTagboxWithTags( 3, { delimiters: delimiters } );
    //     var input = tb.element.select( '.tagbox-tags li input[type=text]' ).last();
    // 
    //     delimiters.each( function( delimiter ) {
    //         var tag_count = tb.values().length;
    // 
    //         input.value = getUniqueString();
    //         Event.simulateKey( input, 'keypress', { charCode: delimiter } );
    // 
    //         this.assert( tb.values().length == tag_count + 1 );
    //     }.bind( this ) );
    // },

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
        var tb = createTagboxWithTags( 1, { show_remove_links: false } );
        this.assert( ! tb.element.down( '.tagbox-remove' ) );
    },

    testEnablingRemoveLinksOptionAddsLinks: function() {
        var tb = createTagboxWithTags( 1, { show_remove_links: true } );
        this.assert( tb.element.down( '.tagbox-remove' ) );
    },

    /* option: allow_duplicates */

    testDisablingAllowDuplicatesAllowsDuplicates: function() {
        var tb = createTagbox( { allow_duplicates: false } );

        var value = getUniqueString();
        var original_tag_count = addTags( tb, [ value, value ] );

        this.assert( tb.values().length == original_tag_count + 1 );
    },

    testEnablingAllowDuplicatesDisallowsDuplicates: function() {
        var tb = createTagbox( { allow_duplicates: true } );

        var value = getUniqueString();
        var original_tag_count = addTags( tb, [ value, value ] );

        this.assert( tb.values().length == original_tag_count + 2 );
    },

    /* option: case_sensitive */

    testEnablingCaseSensitiveAllowsDuplicatesWithDifferentCase: function() {
        var tb = createTagbox( { allow_duplicates: false, case_sensitive: true } );

        var value = getUniqueString();
        var original_tag_count = addTags( tb, [ value.toLowerCase(), value.toUpperCase() ] );

        this.assert( tb.values().length == original_tag_count + 2 );
    },

    testDisablingCaseSensitiveDisallowsDuplicatesWithDifferentCase: function() {
        var tb = createTagbox( { allow_duplicates: false, case_sensitive: false } );

        var value = getUniqueString();
        var original_tag_count = addTags( tb, [ value.toLowerCase(), value.toUpperCase() ] );

        this.assert( tb.values().length == original_tag_count + 1 );
    },

    /* option: allowed */

    testAllowedLimitsAllowedInput: function() {
        var allowed_values = $R(1, 3).inject( [], function( arr ) {
            arr.push( getUniqueString() );
            return arr;
        } );

        var tb = createTagbox( { allowed: allowed_values } );
        var original_tag_count = tb.values().length;

        tb.addTag( getUniqueString() );
        this.assert( tb.values().length == original_tag_count );

        tb.addTag( allowed_values[1] );
        this.assert( tb.values().length == original_tag_count + 1 );
    },

    /* option: hint */

    testHintInitiallyHidden: function() {
        var tb = createTagbox( { hint: 'type something' } );
        this.assertUndefined( tb.element.down( '.tagbox-hint' ) );
    },

    testHintVisibleOnInputFocus: function() {
        var delay = 0;
        var tb = createTagbox( { hint: 'type something', hint_delay: delay } );

        tb.focus( tb.element.select( '.tagbox-tags li' ).last() );

        this.wait( delay + STD_DELAY, function() {
            this.assertVisible( tb.element.down( '.tagbox-hint' ) );
        } );
    },

    testHintWaitsForDelay: function() {
        var delay = STD_DELAY;
        var tb = createTagbox( { hint: 'type something', hint_delay: delay } );

        tb.focus( tb.element.select( '.tagbox-tags li' ).last() );

        this.wait( STD_DELAY / 2, function() {
            this.assertUndefined( tb.element.down( '.tagbox-hint' ) );
        } );

        this.wait( delay + STD_DELAY, function() {
            this.assertVisible( tb.element.down( '.tagbox-hint' ) );
        } );
    },

    testHintAppearsOnInputFocus: function() {
        var delay = 0;
        var tb = createTagbox( { hint: 'type something', hint_delay: delay } );

        this.assertUndefined( tb.element.down( '.tagbox-hint' ) );

        tb.focus( tb.element.select( '.tagbox-tags li' ).last() );

        this.wait( delay + STD_DELAY, function() {
            this.assertVisible( tb.element.down( '.tagbox-hint' ) );
        }.bind( this ) );
    }
});

/**
 * test helper methods
 **/
var helpers = {
    STD_DELAY: 200,

    addTags: function( tagbox, values ) {
        var original_tag_count = tagbox.values().length;
        values.each( tagbox.addTag.bind( tagbox ) );
        return original_tag_count;
    },

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
        return 'string-' + ( Math.random() * Math.pow( 10, 8 ) ).floor().toString();
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

// inject helper methods into current scope
Object.extend( this, helpers );
