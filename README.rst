=======
Tag Box
=======

`Tag Box`_ is an unobtrusive javascript library which provides a
multi-value text input.

Usage
=====

Include the Tag Box assets::

    <link rel="stylesheet" href="tagbox/tagbox.css" type="text/css" media="screen"/>
    <script src="tagbox/tagbox.js" type="text/javascript"></script>

Add a text input to your page, with the `tagbox` class::

    <input type="text" name="tags" class="tagbox"/>

As soon as the browser is ready Tag Box will find those inputs and convert
them to tag boxes.

Options
-------

Tag Box can be configured with these options:

allow_duplicates : boolean, default: false
  Allow duplicate tags

case_sensitive : boolean, default: false
  Pay attention to case when checking for duplicates. This option has no
  effect when allow_duplicates is `true`

triggers : array, default: [ Event.KEY_COMMA, Event.KEY_RETURN ]
  An array of key codes which trigger the creation of a new tag from typed
  text

Requirements
============

Tag Box requires `Prototype.js`_ 1.6+

Credits
=======

TagBox was heavily inspired by `Guillermo Rauch's TextboxList`_ for MooTools.

.. _`Tag Box`: http://rfletcher.github.com/tagbox/
.. _`Prototype.js`: http://prototypejs.org/
.. _`Guillermo Rauch's TextboxList`: http://devthought.com/blog/projects-news/2008/01/textboxlist-fancy-facebook-like-dynamic-inputs/