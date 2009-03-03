=======
Tag Box
=======

`Tag Box`_ is an unobtrusive javascript library which provides a
multi-value text input.

-----
Usage
-----

Include the Tag Box assets::

    <link rel="stylesheet" href="tagbox/tagbox.css" type="text/css" media="screen"/>
    <script src="tagbox/tagbox.js" type="text/javascript"></script>

Add a text input to your page, with the `tagbox` class::

    <input type="text" name="tags" class="tagbox" value="these, are, tags"/>

As soon as the browser is ready Tag Box will convert those inputs from text boxes
to tag boxes, automatically converting any value into tags.

Options
-------

Tag Box can be configured with these options:

allow_duplicates : boolean, default: false
  Allow duplicate tags

case_sensitive : boolean, default: false
  Pay attention to case when checking for duplicates. This option has no
  effect when allow_duplicates is `true`.

delimiters : array, default: [ Event.KEY_COMMA, Event.KEY_RETURN ]
  An array of key codes which trigger the creation of a new tag from typed
  text.

show_remove_links : boolean, default: false
  Add small 'x' links to each tag which, when clicked, remove that tag from
  the list.

validation_function : Function, default = null
  A function which validates new input before adding it as a tag. It will be
  passed the String value as the only parameter, and should return a Boolean.

------------
Requirements
------------

Tag Box requires `Prototype.js`_ 1.6+

---------
Changelog
---------

* 0.1, initial release
    - new: original input's value is parsed into tags
    - new: added the `allow_duplicates` option
    - new: added the `case_sensitive` option
    - new: added the `delimiters` option
    - new: added the `show_remove_links` option
    - new: added the `validation_function` option

-------
Credits
-------

TagBox was heavily inspired by `Guillermo Rauch's TextboxList`_ for MooTools.

.. _`Tag Box`: http://rfletcher.github.com/tagbox/
.. _`Prototype.js`: http://prototypejs.org/
.. _`Guillermo Rauch's TextboxList`: http://devthought.com/blog/projects-news/2008/01/textboxlist-fancy-facebook-like-dynamic-inputs/