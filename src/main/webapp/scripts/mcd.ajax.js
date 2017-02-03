var MCD = window.MCD || (window.MCD = {});


	/**
 * @name				MCD.ajax
 * @description	Offers AJAX handling within the framework.
 * @requires		MCD.core
 * @author			Moritz Kröger <moritz.kroeger@razorfish.de>
 * @copyright		Razorfish GmbH, 2014
 */
MCD.ajax = (function (MCD) {
	'use strict';

	/* Constants */
	var REQUEST = {
		GET: 'get', 
		POST: 'post',
		PUT: 'put',
		DELETE: 'delete'
	};

	/**
	 * @description	Returns either XMLHttpRequest or ActiveXObject.
	 * @private
	 */
	var _createXHR = function () {
		if (typeof XMLHttpRequest !== 'undefined' && (window.location.protocol !== 'file:' || !window.ActiveXObject)) {
			return new XMLHttpRequest();
		} else {
			try {
				return new ActiveXObject('Msxml2.XMLHTTP.6.0');
			} catch (e) {}
			try {
				return new ActiveXObject('Msxml2.XMLHTTP.3.0');
			} catch (e) {}
			try {
				return new ActiveXObject('Msxml2.XMLHTTP');
			} catch (e) {}
		}
		return false;
	};

	/**
	 * @description	Parses a string into JSON.
	 * @private
	 * @param			{String} string
	 * @return			{Object}
	 */
	var _parseJSON = function (string) {
		if (typeof string !== 'string' || !string) return null;
		string = MCD.trim(string);
		return window.JSON.parse(string);
	};

	/**
	 * @description	Parses a string into XML.
	 * @private
	 * @param			{String} string
	 * @return			{Object}
	 */
	var _parseXML = function (string) {
		/* If !DOMParser then we're dealing with almighty IE 8. Great, isn't it? ʕ•͡ᴥ•ʔ */
		if (window.DOMParser) {
			return new DOMParser().parseFromString(string, 'application/xml');
		} else {
			var XML = new ActiveXObject('Microsoft.XMLDOM');
			XML.async = 'false';
			XML.loadXML(string);
			return XML;
		}
	};

	/**
	 * @description	Serialise a JavaScript object into a string 
	 *						which can be used via GET or POST.
	 * @private
	 * @param			{Object} obj
	 * @return			{String}
	 */
	var _serialise = function (obj) {
		/* Checking for hasOwnProperty() prevents accidentally serialising methods inside of the object. */
		var results = [];
		if (!obj) return;
		if (typeof obj === 'string') return obj;
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) results.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
		}
		return results.join('&');
	};

	/**
	 * @description	Tries to send AJAX request, otherwise throws an optional error.
	 * @private
	 * @param			{Function} request
	 * @param			{Object} options
	 */
	var _sendRequest = function (request, options) {
		try {
			request.send(options.postBody);
		} catch (e) {
			if (options.error) options.error();
		}
	};

	/**
	 * @description	Just because it looks ugly if written in the if statement.
	 * @private
	 * @param			{Object} request
	 * @return			{Boolean}
	 */
	var _successfulRequest = function (request) {
		return (
			request.status >= 200 && request.status < 300) || 
			request.status === 304 || 
			(request.status === 0 && request.responseText
		);
	};

	/** 
	 *	@description	Creates a JSONP callback.
	 * @private
	 * @param			{String} url
	 * @param			{Object} success
	 * @param			{Object} failure
	 * @return			{Function}
	 */
	var JSONPCallback = function (url, success, error) {
		var self = this;
		this.url = url;
		this.methodName = '__MCD-jsonp__' + parseInt(new Date().getTime(), 10);
		this.success = success;
		this.error = error;

		function runCallback (json) {
			self.success(json);
			self.teardown();
		}
		window[this.methodName] = runCallback;
	};

	JSONPCallback.prototype.run = function () {
		this.scriptTag = document.createElement('script');
		this.scriptTag.id = this.methodName;
		this.scriptTag.src = this.url.replace('{callback}', this.methodName);
		document.body.appendChild(this.scriptTag);
	};

	JSONPCallback.prototype.teardown = function () {
		window[this.methodName] = null;
		delete window[this.methodName];
		if (this.scriptTag) document.body.removeChild(this.scriptTag);
	};

	/**
	 * @description	Creates an AJAX request.
	 * @param			{String} url
	 * @param			{Object} options
	 * @return			{Object}
	 */
	var _ajax = function (url, options) {		
		var request = _createXHR();
		var response = {};
		
		function _readyStateChangeRespond () {
			if (request.readyState === 4) {
				// Get the content-type we're dealing with.
				var contentType = request.mimeType || request.getResponseHeader('content-type') || '';
				
				response.status = request.status;
				response.responseText = request.responseText;

				// Everything fine? Cool, send the success then.
				response.success = _successfulRequest(request);

				if (options.callback) return options.callback(response, request);
				
				if (response.success) {
					if (options.success) options.success(response, request);
				} else {
					if (options.error) options.error(response, request);
				}
			}
		}

		function _setHeader () {
			var defaults = {
				'Accept': 'text/javascript, application/json, text/html, application/xml, text/xml, */*',
				'Content-Type': 'application/x-www-form-urlencoded'
			};

			for (var type in defaults) {
				if (!options.headers.hasOwnProperty(type)) options.headers[type] = defaults[type];
			}

			for (var name in options.headers) {
				request.setRequestHeader(name, options.headers[name]);
			}
		}

		if (typeof options === 'undefined') options = {};
	
		options.method = options.method ? options.method.toLowerCase() : REQUEST.GET;
		options.async = options.async || true;
		options.postBody = options.postBody || null;
		request.onreadystatechange = _readyStateChangeRespond;
		request.open(options.method, url, options.async);

		options.headers = options.headers || {};

		if (options.contentType) options.headers['Content-Type'] = options.contentType;
		if (typeof options.postBody !== 'string') options.postBody = _serialise(options.postBody);

		if (options.timeout) request.timeout = options.timeout;
		if (options.abort) request.ontimeout = options.abort();

		_setHeader();
		_sendRequest(request, options);

		return request;
	};

	/**
	 * @name				MCD.get
	 * @description	An AJAX 'GET' request.
	 * @public
	 * @param			{String} url
	 * @param			{Object} options
	 * @return			{Function}
	 * =========
	 * MCD.ajax.get('url/to/anything', {
	 *		dataType: {String}, [optional]
	 *		success: {Function},
	 *		error: {Function}
	 * });
	 * =========
	 */
	var get = function (url, options) {
		if (typeof options === 'undefined') options = {};
		if (options.dataType === 'jsonp') {
			var callback = new JSONPCallback(url, options.success, options.error);
			callback.run();
		} else {
			options.method = REQUEST.GET;
			return _ajax(url, options);
		}
	};

	/**
	 * @name				MCD.post
	 * @description	An AJAX 'POST' request.
	 * @public
	 * @param			{String} url
	 * @param			{Object} options
	 * @return			{Function}
	 * =========
	 * MCD.ajax.post('url/to/anything', {
	 *		data: {Object},
	 *		contentType: {String},
	 *		success: {Function},
	 *		error: {Function}
	 * });
	 * =========
	 */
	var post = function (url, options) {
		if (typeof options === 'undefined') options = {};
		options.method = REQUEST.POST;
		options.postBody = options.data;
		return _ajax(url, options);
	};

	/**
	 * @name				MCD.put
	 * @description	An AJAX 'PUT' request.
	 * @public
	 * @param			{String} url
	 * @param			{Object} options
	 * @return			{Function}
	 * =========
	 * MCD.ajax.put('url/to/anything', {
	 *		data: {Object},
	 *		contentType: {String},
	 *		success: {Function},
	 *		error: {Function}
	 * });
	 * =========
	 */
	var put = function (url, options) {
		if (typeof options === 'undefined') options = {};
		options.method = REQUEST.PUT;
		options.postBody = options.data;
		return _ajax(url, options);
	};

	/**
	 * @name				MCD.kill
	 * @description	An AJAX 'DELETE' request.
	 * @public
	 * @param			{String} url
	 * @param			{Object} options
	 * @return			{Function}
	 * =========
	 * MCD.ajax.kill('url/to/anything', {
	 *		success: {Function},
	 *		error: {Function}
	 * });
	 * =========
	 */
	var kill = function (url, options) {
		if (typeof options === 'undefined') options = {};
		options.method = REQUEST.DELETE;
		return _ajax(url, options);
	};

	/* Returns public API */
	return {
		method: REQUEST,
		get: get,
		post: post,
		put: put,
		kill: kill
	};
	
}(MCD));