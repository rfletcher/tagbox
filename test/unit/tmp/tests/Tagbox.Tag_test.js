var globalArgsTest = 'nothing to see here';

new Test.Unit.Runner( {
    setup: function() {
        tag = new Tagbox.Tag( null, 'value' );
    },

    test1: function() {
        this.assertEnumEqual( 1, 1 );
    },

    test2: function() {
        this.assertEnumEqual( 1, 1 );
    }
} );