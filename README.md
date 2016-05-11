# m-parser - scrap any pages easy

## Super simple to use

Request is designed to be the simplest way possible to make page scrapping. It supports PhantomJS, request and just parse HTML tree.

```javascript
var parser = require('m-parser');
parser({
    url: 'http://google.com',
    encoding: 'utf-8', // 'utf-8' by default
    phantom: true // should use phantom scrapper
    data: {
        posts: '.posts', //simple usage
        post: {
            query: ['query1', 'query2'],
            attr: 'href', // if need to return an attribute value
            skip: 10, // 0 by default
            limit: 2,  // all by default
            return_type: 'object', // by default 'array'. Will be return first element
            formatter: ['trim', 'n', 'special'], // by default all = ['trim', 'n', 'special']
            fn_formatter: function(v) {
                return v.replace(/\n/gi, '')
            },
            attr_fn_formatter: function(v) {
                return v.split('#')[0]
            },
            filter: function(v) {
                return v.should_push_or_not
            }
        }
    },
}, function succ_cb (r){
    var data = r.data
    console.log('data - ', data);
    console.log('posts - ', data.posts);
    console.log('first post - ', data.post);
}, function error_cb (err){
    console.log('an error here')
})
```