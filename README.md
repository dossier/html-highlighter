# HTML Highlighter

The HTML Highlighter is a JavaScript that solves these problems:

 1. Display colorful highlights on words in a live Web page that are
    determined by either or both of these sources:
    1. User `selections` identified by a user dragging their pointer
       over a portion of a page, possibly covering multiple tags in
       the DOM tree.
    1. Machine `selections` identified by a program, which might run
       in the browser or in a server-side environment that processes
       the HTML and text of a page to decide which portions of content
       should be marked.
 1. Provide objects isomorphic to JavaScript's `Range` object, which
    has [character offsets relative to DOM nodes identified by Xpaths](https://github.com/dossier/html-highlighter/blob/0.1.0/src/html_highlighter.js#L1067-L1076):
```javascript
{
    start: {
        xpath: <string> // unique address to DOM node
        offset: <int> // relative character offset
    },
    end: {
        xpath: <string> // unique address to DOM node
        offset: <int> // relative character offset
    }
}
```
 1. Provide these offsets to either JavaScript or backend tools.
    [StreamCorpus Pipeline](https:/github.com/trec-kba/streamcorpus-pipeline) is being extended to provide translation between 


The inline comments and class documentation are sufficient for a
JavaScript programmer to jump in and start using this.  To see an
example, you can:

```bash
    git clone git://github.com/dossier/html-highlighter
    cd html-highlighter
    $BROWSER examples/index.html
```