# m - Is a mongoose wrapper + common JS methods

## Super simple to use

Request is designed to be the simplest way possible to make page scrapping. It supports PhantomJS, request and just parse HTML tree.



Find/FindCreate/FindUpdate
```javascript
var m = require('nm-m');

app.get('/posts', function(req, res) {
    m.find(Model, query, res, res, {limit: 5, skip: 15, populate: 'populate_field'});
})

app.put('/posts', function(req, res) {
    var on_update_obj = m.getBody(req).data;
    m.findUpdate(PostModel, {_id: on_update_obj._id}, on_update_obj, res, res);
})

app.put('/posts-and-create-if-not-found', function(req, res) {
    m.findCreateUpdate(PostModel, {_id: on_update_obj._id}, on_update_obj, res, res);
})

app.post('/posts', function(req, res) {
    var new_post = m.getBody(req).data
    m.create(Model, new_post, res, res)
})

app.delete('/posts', function(req, res) {
    var to_delete_query = m.getBody(req).data
    m.delete(Model, to_delete_query, res, res)
})

app.get('/posts/count', function(req, res) {
    var query = m.getBody(req).data
    m.count(Model, query, res, res)
})

app.put('/posts-if-you-want handle-callbacks', function(req, res) {
    m.findOne(PostModel, {_id: on_update_obj._id}, function(err){
        //if you need to handle an error and not just send to trigger res.send
        m.ecb(399, err, res);
    }, function(item){
        item = m.extend(item, on_update_obj)
        m.save(item, res, function(update_item){
            m.scb({
                message: 'Item is updated without issues'
            }, res)
        })
    });
})
```

Scb/Ecb
```javascript
var m = require('nm-m');

m.scb(obj, cb) // cb can be function or res object
```


```javascript
var m = require('nm-m');

m.parallelLimit({
	fn: function (cb, item, index) {
		// do something with each item
		item.update(function(err, r){
		    cb(err, r);
		})
	},
	items: [{
		_id: '1',
	}, {
		_id: '2',
	}],
	limit: 5,
	timeout: 1000, //in ms for each block of iterations
	cb: function () {
		//all is done
	}
});
```


Methods Short List
```javascript
module.exports = {
    res_send: res_send,
    ecb: ecb,
    scb: scb,
    found_scb: found_scb,
    getBody: getBody,

    count: count,
    find: find,
    findLean: findLean,
    findOne: findOne,
    save: save,
    create: create,
    insertMany: insertMany,
    findRemove: findRemove,
    _findRemove: _findRemove,

    findUpdate: findUpdate,
    _findCreateUpdate: _findCreateUpdate,
    findCreateUpdate: findCreateUpdate,
    findCreate: findCreate,

    parallelLimit: parallelLimit
};
```