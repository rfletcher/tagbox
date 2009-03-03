======
Tagbox
======

`Tagbox`_ is an unobtrusive javascript library which provides a
multi-value text input.

Try the demo: http://rfletcher.github.com/tagbox/demo/

Supported Browsers
==================

Tagbox currently supports the following browsers:

- Microsoft Internet Explorer, version 7.0 and higher
- Mozilla Firefox 3.0 and higher
- Apple Safari 3.1 and higher

============
Using Tagbox
============

Include the Tagbox assets::

    <link rel="stylesheet" href="tagbox/assets/tagbox.css" type="text/css" media="screen"/>
    <script src="tagbox/dist/tagbox.js" type="text/javascript"></script>

Add a text input to your page, with the `tagbox` class::

    <input type="text" name="tags" class="tagbox" value="these, are, tags"/>

As soon as the browser is ready Tagbox will convert those inputs from text boxes
to tag boxes, automatically converting any value into tags.

Requirements
============

Tagbox requires `Prototype.js`_ 1.6+

Options
=======

Tagbox can be configured with these options:

allow_duplicates : boolean, default: false
  Allow duplicate tags

case_sensitive : boolean, default: false
  Pay attention to case when checking for duplicates. This option has no
  effect when allow_duplicates is `true`.

delimiters : array, default: [ Event.KEY_COMMA, Event.KEY_RETURN ]
  An array of key codes which trigger the creation of a new tag from typed
  text.

max_tags : number, default: null
  The maximum number of tags that can be entered.

show_remove_links : boolean, default: false
  Add small 'x' links to each tag which, when clicked, remove that tag from
  the list.

validation_function : Function, default = null
  A function which validates new input before adding it as a tag. It will be
  passed the String value as the only parameter, and should return a Boolean.

Building Tagbox from source
===========================

``tagbox.js`` is generated from multiple source files in the ``src/`` directory. 
To build Tagbox, you'll need:

* A copy of the Tagbox source tree
* Ruby_ & Rake_
* The Sprockets_ gem

From the root Tagbox directory, run:

* ``rake dist`` to generate ``dist/tagbox.js``
* ``rake package`` to create a distribution tarball in the ``pkg/`` directory

=========
Changelog
=========

0.2

- new: added the ``max_tags`` option

0.1

- new: original input's value is parsed into tags
- new: added the ``allow_duplicates`` option
- new: added the ``case_sensitive`` option
- new: added the ``delimiters`` option
- new: added the ``show_remove_links`` option
- new: added the ``validation_function`` option

=======
Credits
=======

Tagbox was heavily inspired by `Guillermo Rauch's TextboxList`_ for MooTools.

.. _`Tagbox`: http://rfletcher.github.com/tagbox/
.. _`Prototype.js`: http://prototypejs.org/
.. _`Prototype Event docs`: http://prototypejs.org/api/event/observe
.. _`Guillermo Rauch's TextboxList`: http://devthought.com/blog/projects-news/2008/01/textboxlist-fancy-facebook-like-dynamic-inputs/
.. _Ruby: http://www.ruby-lang.org/
.. _Rake: http://rake.rubyforge.org/
.. _Sprockets: http://getsprockets.org/
