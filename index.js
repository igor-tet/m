var _ = require('underscore')
	, each = require('async-each-series')
	, async = require('async');

function res_send(status, obj, res) {
	
	var params = _.extend({
			data: obj,
			success: status == 200
		}, {
			server_response_time: new Date().getTime() - res._start_time
		}
	)
	if (status != 200) {
		params.error = params.error || params.data;
		delete params.data;
	}
	
	if (res._token_end_time) {
		params.server_token_checking_time = res._token_end_time - res._token_start_time
	}
	
	res.status(status).send(params)
}

function ecb(status, obj, cb) {
	if (typeof cb == 'function') {
		cb(status, obj)
	} else if (cb && cb.send) {
		res_send(status, obj, cb)
	}
}

function scb(obj, cb) {
	if (typeof cb == 'function') {
		cb(obj)
	} else if (cb && cb.send) {
		res_send(200, obj, cb)
	}
}

function found_scb(obj, text, cb) {
	if (typeof cb == 'function') {
		cb(obj)
	} else if (cb && cb.send) {
		if (obj.length) {
			res_send(200, obj, cb)
		} else {
			res_send(200, text, cb)
		}
	}
}

function _mongoose_cb_handler(err, data, _ecb, _scb, params) {
	if (err) {
		ecb(398, err, _ecb)
	} else if (!data) {
		err = params['not_found'] ? params['not_found'] : 'Item not found'
		ecb(397, err, _ecb)
	} else {
		scb(data, _scb)
	}
}

function find(model, query, _ecb, _scb, params) {
	params = params || {};
	params.skip = parseInt(params.skip) || 0;
	if (params.limit > 0) {
		params.limit = parseInt(params.limit) || 100;
	}
	if (!model) {
		ecb(399, 'Model not found', _ecb)
		return;
	}
	model
		.find(query)
		.sort(params.sort)
		.skip(params.skip)
		.limit(params.limit)
		.select(params.select || params.fields)
		.populate(params.populate || '')
		.exec(function (err, items) {
			_mongoose_cb_handler(err, items, _ecb, _scb, params)
		})
}

function findLean(model, query, _ecb, _scb, params) {
	params = params || {};
	params.skip = parseInt(params.skip) || 0;
	params.limit = parseInt(params.limit) || 100;
	if (!model) {
		ecb(399, 'Model not found', _ecb)
		return;
	}
	model
		.find(query)
		.sort(params.sort)
		.skip(params.skip)
		.limit(params.limit)
		.select(params.select || params.fields)
		.populate(params.populate || '')
		.lean()
		.exec(function (err, items) {
			_mongoose_cb_handler(err, items, _ecb, _scb, params)
		})
}

function save(model, _ecb, _scb, params) {
	params = params || {};
	model.save(function (err, data) {
		data = data && data.publish && params.publish ? data.publish() : data
		_mongoose_cb_handler(err, data, _ecb, _scb, params)
	})
}

function parallel_limit(params) {
	params = params || {};
	var fn = params.fn,
		items = params.items,
		limit = params.limit,
		timeout = params.timeout,
		mcb = params.cb,
		arr = [];
	
	items && items.forEach(function (item, i) {
		arr.push(function (callback) {
			if (timeout) {
				setTimeout(function () {
					fn && fn(callback, item, i)
				}, timeout)
			} else {
				fn && fn(callback, item, i)
			}
		})
	});
	
	async.parallelLimit(arr, limit,
		function (err, results) {
			mcb && mcb(err, results)
		});
}

function decodeBase64Image(dataString) {
	var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
	var response = {};
	
	if (matches.length !== 3) {
		return new Error('Invalid input string');
	}
	
	response.type = matches[1];
	response.data = new Buffer(matches[2], 'base64');
	
	return response;
}

function findOne(model, query, _ecb, _scb, params) {
	params = params || {};
	if (!model) {
		ecb(399, 'Model not found', _ecb);
		return;
	}
	model
		.findOne(query)
		.sort(params.sort)
		.populate(params.populate || '')
		.exec(function (err, data) {
			data = data && data.publish && params.publish ? data.publish() : data
			_mongoose_cb_handler(err, data, _ecb, _scb, params)
		})
}

function count(model, new_params, _ecb, _scb, params) {
	if (!model) {
		ecb(399, 'Model not found', _ecb);
		return;
	}
	
	model.count(new_params, function (err, data) {
		_mongoose_cb_handler(err, data, _ecb, _scb, params)
	})
}

function create(model, new_params, _ecb, _scb, params) {
	params = params || {};
	new_params = new_params || []
	
	model.create(new_params, function (err, data) {
		data = data && data.publish && params.publish ? data.publish() : data
		_mongoose_cb_handler(err, data, _ecb, _scb, params)
	})
}

function insertMany(model, new_params, _ecb, _scb, params) {
	if (!model) {
		ecb(399, 'Model not found', _ecb);
		return;
	}
	var err
	var arrOfResults = new_params || []
	
	var N = 2500;
	var count = 0;
	var c = Math.round(arrOfResults.length / N) + 1;
	var l = arrOfResults.length
	var fakeArr = [];
	fakeArr.length = c;
	
	each(fakeArr, function (item, callback) {
		var sliced = arrOfResults.slice(count, count + N);
		count = count + N;
		if (sliced.length != 0) {
			model.create(sliced, function (_err, data) {
				err = _err || err
				log('Insert Items', count, ' / ', l);
				setTimeout(function () {
					callback()
				}, 250)
			})
		} else {
			callback()
		}
	}, function (e) {
		if (err) {
			ecb(398, err, _ecb)
		} else {
			scb({count: arrOfResults.length}, _scb)
		}
	});
}


function findUpdate(model, query, new_params, _ecb, _scb, params) {
	findOne(model, query, _ecb, function (item) {
		item = _.extend(item, new_params);
		save(item, _ecb, _scb, params)
	})
	
}


function findCreateUpdate(model, query, new_params, _ecb, _scb, params) {
	new_params = _.extend(query, new_params);
	findOne(model, query, function (code, err) {
		if (code == 397) {
			create(model, new_params, _ecb, _scb, params)
		} else {
			ecb(code, err, _ecb)
		}
	}, function (item) {
		item = _.extend(item, new_params);
		save(item, _ecb, _scb, params)
	})
}


function _findCreateUpdate(model, query, _ecb, _scb, params, upsert) {
	upsert = upsert || true;
	model.update(query, {$inc: params}, {upsert: upsert}, function (err, item) {
			if (err) {
				ecb(398, err, _ecb)
			} else {
				scb(item, _scb)
			}
		}
	)
}


function findCreate(model, query, _ecb, _scb, params) {
	findOne(model, query, function (code, err) {
		if (code == 397) {
			create(model, query, _ecb, _scb, params)
		} else {
			ecb(code, err, _ecb)
		}
	}, _scb)
}

function findRemove(model, query, _ecb, _scb) {
	find(model, query, _ecb, function (items) {
		var _err;
		var _data = [];
		var index = -1;
		var count = items.length;

		cb()

		items && items.forEach(function (item) {
			item.remove(function (err) {
				if (err) {
					_err = err;
					item = item.toJSON();
					item.REMOVE_ERROR = true;
				}
				_data.push(item)
				cb()
			})
		});


		function cb() {
			index++;
			if (index == count) {
				_mongoose_cb_handler(_err, _data, _ecb, _scb);
			}
		}
	})
}

function isEmptyObj(v) {
	try {
		r = Object.keys(v).length < 1;
	} catch (e) {
		return true;
	}
	return r;
}

function getBody(req) {
	return isEmptyObj(req.query) ? req.body || {} : req.query
}


function _findRemove(model, query, _ecb, _scb) {
	model.remove(query, function (err, result) {
		if (err) {
			ecb(398, err, _ecb)
		} else {
			scb(result, _scb)
		}
	})
}

function createToken(models, user, _ecb, _scb) {
	var query = {user: user._id, role: user.role}
	findCreate(models.AccessToken, query, null, _ecb, function (accessToken) {
		findCreate(models.RefreshToken, query, null, _ecb, function (refreshToken) {
			scb({
				accessToken: accessToken.publish(),
				refreshToken: refreshToken.publish(),
				user: user.publish()
			}, _scb)
		})
	})
}

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
	// findCreate2: findCreate2,
	createToken: createToken,
	
	extend: _.extend,
	decodeBase64Image: decodeBase64Image,
	parallelLimit: parallel_limit
};