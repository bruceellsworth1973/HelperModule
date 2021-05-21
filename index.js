Object.assign(exports, (function()
{
	const {readFileSync, writeFileSync, readFile, writeFile, readdir, stat, rename} = require('fs');
	const {exec} = require('child_process');
	const KEYS = 'keys';
	const VALUES = 'values';
	const ENTRIES = 'entries';
	const encoding = 'utf8';
	const {parse, stringify} = JSON;
	const {min, max, ceil, floor} = Math;
	const tryCatch = (a, b) => {
		try {return a();}
		catch (e) {return b(e);}
	};
	const deepEqual = (x, y) => {
		// first test basic equality
		if (x === y) {return true;}
		// next compare data types
		if (typeof x !== typeof y) {return false;}
		// perform deep comparison
		switch (typeof x)
		{
			case 'object':
			{
				// compare all properties in x to properties in y
				for (const p in x)
				{
					if (x.hasOwnProperty(p) !== y.hasOwnProperty(p)) {return false;}
					// recursively call deepEqual until basic properties at every level have been compared
					if (!deepEqual(x[p], y[p])) {return false;}
				}
				// test for properties in y missing from x
				for (const p in y)
				{
					if (typeof (x[p]) === 'undefined') {return false;}
				}
				break;
			}
			case 'function':
			{
				if (typeof y === 'undefined' || x.toString() !== y.toString()) return false;
				break;
			}
			// if we are here, inequality of basic comparison is already established at the top of the algorithm
			default: {return false;}
		}
		// if the switch statement falls through then the comparison succeeds
		return true;
	};
	const isEqual = (a, b) => 'undefined' === typeof b
		? b => deepEqual(a, b)
		: deepEqual(a, b);
	const notEqual = (a, b) => 'undefined' === typeof b
		? b => !deepEqual(a, b)
		: !deepEqual(a, b);
	const {isArray} = Array;
	const isObject = x => ('object' === typeof x) && !isArray(x);
	const isBoolean = x => 'boolean' === typeof x;
	const isNumber = x => 'number' === typeof x;
	const isString = x => 'string' === typeof x;
	const isFunction = x => 'function' === typeof x;
	const isUndefined = x => 'undefined' === typeof x;
	const isTrue = x => x === true;
	const isFalse = x => x === false;
	const isNull = x => x === null;
	const isEmpty = x => isNull(x) || isUndefined(x) || ((isArray(x) || isString(x)) && x.length === 0) || Object.keys(x).length === 0 || x.size === 0;
	const exists = x => !(isNull(x) || isUndefined(x));
	const apply = function(fn, ...args) {return fn.apply(this, args);}
	const identity = v => v;
	const noop = () => {};
	const execute = (x, fn) => fn(x);
	const then = fn => (prev, next) => prev.then(next, isFunction(fn) ? fn : noop);
	const resolve = x => Promise.resolve(x);
	const reject = x => Promise.reject(x);
	const concurrent = (arr, fn) => Promise.all(map(fn, arr));
	const chain = (request, response) => request.then(result => ({result}), error => ({error})).then(response);
	const promisify = (fn, index = 0) => function(...args) {return new Promise((resolve, reject) => fn.call(this, ...args, (e, ...results) => e ? reject([e, ...results]) : resolve(isNumber(index) ? results[index] : results)));};
	const fill = x => () => x;
	const tap = (fna, fnb) => x => (fna(x), fnb ? fnb(x) : x);
	const trace = (label, fn = console.log) => tap(x => fn({[label]:x}));
	const error = (label, fn = console.error) => trace(label, fn);
	const nvl = replace => x => exists(x) ? x : replace;
	const unary = fn => x => fn(x);
	const binary = fn => (x, y) => fn(x, y);
	const prop = x => z => isString(x) ? z[x] : isString(z) ? x[z] : null;
	const iterable = (obj, type = ENTRIES) => isObject(obj) && (type in Object) ? Object[type](obj) : type === ENTRIES ? [].entries() : [];
	const expand = (fn, x) => isUndefined(x)
		? x => fn((y, x) => [y, ...expand(fn, x)], () => [], x)
		: fn((y, x) => [y, ...expand(fn, x)], () => [], x);
	const reduce = fn => (arr, x) => isUndefined(x)
		? arr.reduce(fn)
		: arr.reduce(fn, x);
	const fold = fn => (arr, x) => isUndefined(x)
		? arr.reduceRight(fn)
		: arr.reduceRight(fn, x);
	const compose = (...fns) => x => apply(fold(execute), fns, x||null);
	const composeAsync = fn => (...fns) => x => apply(fold(then(fn)), fns, resolve(x));
	const pipe = (...fns) => x => apply(reduce(execute), fns, x||null);
	const pipeAsync = fn => (...fns) => x => apply(reduce(then(fn)), fns, resolve(x));
	const concat = (y, x) => x + y;
	const reverse = arr => arr.reverse();
	const match = reg => str => isUndefined(str)
		? str => str.match(reg) || []
		: str.match(reg) || [];
	const regex = reg => str => isUndefined(str)
		? str => reg.exec(str) || []
		: reg.exec(str) || [];
	const forEach = (fn, arr) => isUndefined(arr)
		? arr => arr.forEach(fn)
		: arr.forEach(fn);
	const map = (fn, arr) => isUndefined(arr)
		? arr => arr.map(fn)
		: arr.map(fn);
	const filter = (fn, arr) => isUndefined(arr)
		? arr => arr.filter(fn)
		: arr.filter(fn);
	const objectSort = (obj, arr) => isUndefined(arr)
		? arr => arr.map(compose(nvl({}), prop(obj)))
		: arr.map(compose(nvl({}), prop(obj)));
	const arrayColumn = (arr, str) => isUndefined(str)
		? str => arr.map(prop(str))
		: arr.map(prop(str));
	const sum = reduce(concat);
	const join = (delimiter = '') => arr => arr.join(delimiter);
	const split = delimiter => str => str.split(delimiter);
	const trim = str => str.trim();
	const toNumber = x => +x;
	const toObject = str => tryCatch(() => parse(str), fill(str));
	const toString = obj => tryCatch(() => stringify(obj), fill(''+obj));
	const toLowerCase = str => isString(str) ? str.toLowerCase() : '';
	const toUpperCase = str => str.toUpperCase();
	const getTime = () => new Date().getTime();
	const distinct = jumble => filter(exists, [...new Set(jumble)]);
	const pad = str => str.padStart(2, '0');
	const toInt = str => +str;
	const toHMS = x => `${parseInt((x/(60*60))%24)}:${pad(''+parseInt((x/60)%60))}:${pad(''+parseInt(x%60))}`;
	const toSeconds = pipe(split(':'), reverse, map(Number), map((v, i) => v * Math.pow(60, i)), sum);
	const clone = pipe(parse, stringify);
	const assign = props => ({to:obj => Object.assign(obj, props)});
	const bind = handlers => ({to:stream => events.call(stream, handlers)});
	const includes = needle => {
		// reports the presence or absence of an array value or an object property
		// nested properties in objects can be searched by specifying an array as the path
		if (isArray(needle))
		{
			return {
				in:haystack => {
					if (!isObject(haystack)) {return false;}
					let acc = haystack;
					while(needle.length)
					{
						const pointer = needle.shift();
						if (pointer in acc)
						{
							acc = acc[pointer];
							continue;
						}
						return false;
					}
					return true;
				}
			}
		}
		return {in:haystack => isArray(haystack) ? haystack.includes(needle) : isObject(haystack) && (needle in haystack)};
	};
	const arrayDifference = (x, y) => x.filter(v => !y.includes(v));
	const initKey = (subject, prop, predicate = {}) => {
		includes(prop).in(subject) || (subject[prop] = predicate);
		return subject[prop];
	};
	const traverse = (obj, arr) => arr.reduce((acc, val) => initKey(acc, val), obj);
	const filterAll = (subject, filter) => {
		for (const [key, val] of iterable(filter)) {subject = subject.replace(key, val);}
		return subject;
	};
	const getAllMatches = (needle, haystack, index) => isNumber(index)
		? haystack.map(v => apply(compose(nvl(v), prop(index), match(needle)), v))
		: haystack.map(match(needle));
	const index = (column, arr) => {
		if (!isString(column) || isEmpty(arr)) {return arr||{};}
		const result = {};
		for (const row of arr) {if (column in row) {result[row[column]] = row;}}
		return result;
	};
	function inject(obj, key, x, overwrite)
	{
		!overwrite && isObject(x) && includes(key).in(obj) ? assign(x).to(obj[key]) : (obj[key] = x);
		return obj;
	}
	function setOrGet(obj, arr, x, overwrite)
	{
		if (!isUndefined(x))
		{
			const key = arr.pop();
			return inject(traverse(obj, arr), key, x, overwrite);
		}
		return traverse(obj, arr);
	}
	const events = function(events)
	{
		for (const [type, listener] of iterable(events)) {this.on(type, listener.bind(this));}
		return this;
	};
	// example syntax for sorting an array of objects that have shared property names (columns): arr.sort(by(column('date', 'desc')).and(column('key')).and(column('part')));
	const compare = bool => bool
		? (a, b) => a > b ? 1 : a < b ? -1 : 0
		: (a, b) => a > b ? -1 : a < b ? 1 : 0;
	const by = prev => assign({and(next) {return by((a, b) => this(a, b) || next(a, b));}}).to(prev);
	const column = (column, order = 'asc', caseSensistive = false) => {
		order = !isEqual('desc', toLowerCase(order));
		return caseSensistive
			? (a, b) => apply(compare(order), a[column], b[column])
			: (a, b) => apply(compare(order), toLowerCase(a[column]), toLowerCase(b[column]));
	};
	const dir = path => apply(promisify(readdir), path, {withFileTypes:true}).then(pipe(filter(prop('isFile')), map(prop('name'))), fill([]));
	const run = command => apply(promisify(exec, null), command).then(([stdout, stderr]) => toObject(trim(stdout||stderr)), ([error, stdout, stderr]) => trim(stderr||stdout||'')||error.message||error);
	// returns disk free percentage as an int value, or 0 if an error occurs
	const df = path => run(`df -h ${path}`).then(pipe(regex(/(\d+)%/), prop(1), nvl(0), toNumber), fill(0));
	const load = (path, def = {}) => tryCatch(() => toObject(readFileSync(path, {encoding})), fill(def));
	const loadAsync = (path, def = {}) => apply(promisify(readFile), path, {encoding}).then(toObject, fill(def));
	const save = (path, data) => writeFileSync(path, toString(data), {encoding, flag:'w'});
	const saveAsync = (path, data) => apply(promisify(writeFile), path, toString(data), {encoding, flag:'w'});
	const chunksToLines = async function*(stream, EOL = '\n')
	{
		if (isString(EOL))
		{
			const offset = EOL.length;
			let buffer = '';
			for await (const chunk of stream)
			{
				buffer += chunk;
				let index;
				while ((index = buffer.indexOf(EOL)) >= 0)
				{
					// lines exclude EOL
					// empty lines will still be yielded
					yield buffer.slice(0, index);
					buffer = buffer.slice(index + offset);
				}
			}
			if (buffer.length > 0) {yield buffer.replace(EOL, '');}
		}
		else {yield '';}
	};
	const abortable = prom => {
		const methods = {abort:noop};
		return assign(methods).to(Promise.race([prom, new Promise((_, abort) => assign({abort}).to(methods))]));
	};
	const consume = (gen, ...args) => {
		let aborted = false, start = noop;
		const current = {action:{abort:noop}}
		const iterable = gen(...args);
		const listeners = apply(reduce((listeners, listener) => ({...listeners, [listener]:noop}), {}), ['error', 'message', 'abort', 'success', 'ended']);
		const on = function(event, listener)
		{
			isString(event) && isFunction(listener) && inject(listeners, event, listener, true);
			return this;
		};
		const trigger = method => message => apply(tap(listeners[method]), message);
		const store = action => inject(current, 'action', abortable(action), true).action;
		const abort = () => {
			current.action.abort();
			apply(trigger('abort'), aborted = true);
		};
		const settle = (message, fn) => pipe(trigger(message), fn);
		const sequence = new Promise((resolve, reject) => {
			const intercept = fn => x => aborted ? reject({reason:'aborted'}) : fn(x);
			const evaluate = ({done, value}) => done
				? apply(settle('success', resolve), value)
				: store(value).then(trigger('message')).then(intercept(next)).catch(intercept(exception));
			const exception = error => apply(settle('error', reject), error);
			const next = response => evaluate(iterable.next(response));
			start = function(x) {next(x); return this};
		}).then(settle('ended', resolve), settle('ended', reject));
		return {stream:{on}, sequence:assign({abort, start}).to(sequence)};
	};
	return ({KEYS, VALUES, ENTRIES, parse, stringify, min, max, ceil, floor, isEqual, notEqual, isArray, isObject, isBoolean, isNumber, isString, isFunction, isUndefined, isTrue, isFalse, isNull, isEmpty, exists, apply, identity, nvl, tap, error, trace, unary, binary, prop, concat, reverse, match, regex, map, forEach, execute, expand, reduce, fold, sum, join, split, noop, toNumber, toObject, toString, toLowerCase, toUpperCase, then, resolve, reject, compose, composeAsync, pipe, pipeAsync, concurrent, chain, iterable, getTime, distinct, objectSort, arrayColumn, parseInt:toInt, pad, toHMS, toSeconds, clone, assign, events, bind, includes, arrayDifference, initKey, traverse, filter:filterAll, getAllMatches, inject, index, setOrGet, compare, by, column, df, stat:promisify(stat), mv:promisify(rename), load, loadAsync, save, saveAsync, dir, run, chunksToLines, consume});
})());
