// defer callback function for specified delay in milliseconds (if valid), or gracefully do nothing if callback is not a function
class Timer
{
	get callback() {return () => this._callback?.();}
	set callback(callback) {this._callback = callback;}
	get deferred() {return this._deferred;}
	set deferred(delay)
	{
		clearTimeout(this.deferred);
		if (delay > 0) {this._deferred = setTimeout(this.callback, delay);}
	}
	import(properties) {assign(properties).to(this);}
	start(callback, deferred) {this.import({callback, deferred});}
	stop() {this.deferred = 0;}
	constructor(callback, delay = 5000) {this.start(callback, delay);}
}
// helper class to create ready signalers and other asynchronous functions
// the valve is in closed state by default
// any functions that await the status property while the valve is in closed state will pause until the valve's open method is called
// any functions that await the status property while the valve is in open state will immediately continue execution as if there was no await
// calling the close method at any time causes the valve status to close,
// which pauses execution of any loops that await the valve status on each iteration
class AsyncSemaphore
{
	get status()
	{
		const awaitOpenEvent = resolve => this._on_open = resolve;
		return this._status || (this._status = new Promise(awaitOpenEvent));
	}
	set status(status)
	{
		if (status)
		{
			if (this._on_open)
			{
				this._on_open(status);
				this._on_open = undefined;
			}
			this._status = Promise.resolve(status);
		}
		else if (this._status && !this._on_open) {this._status = undefined;}
	}
	get isOpen() {return !inspect(this.status).includes('<pending>');}
	open() {this.status = true;}
	close() {this.status = false;}
	constructor(open) {this.status = open;}
}
// returns a proxy object that dynamically generates values for any arbitrary property name
// the property value is defined according to the output of a supplied factory function, using the property name as a modifier
// an optional mutator function can also transform the property name before passing it to the factory function
// values are ephemeral and do not exist except when being accessed
// setting or deleting properties is pointless as the dynamic getter will override any fixed value
class LazyObject
{
	constructor(factory, mutator = v => v)
	{
		const traps = {
			get(_, key) {return factory(mutator(key));},
			set() {return;},
			deleteProperty() {return;}
		};
		return new Proxy({}, traps);
	}
}
class ObjectWatcher
{
	constructor(source, onChange)
	{
		const getValue = (target, key) => Reflect.get(target, key);
		const watch = obj => new Proxy(obj, traps);
		const traps = {
			get(target, key)
			{
				// trigger target object's native getter
				const value = getValue(target, key);
				return (isNull(value) || !isObject(value)) ? value : watch(value);
			},
			set(target, key, newValue)
			{
				const previousValue = getValue(target, key);
				const changed = newValue !== previousValue;
				if (changed)
				{
					// trigger target object's native setter
					Reflect.set(target, key, newValue);
					onChange(target, key, previousValue, newValue);
				}
				return true;
			},
			deleteProperty(target, key)
			{
				const changed = key in target;
				if (changed)
				{
					const newValue = undefined;
					const previousValue = getValue(target, key);
					// trigger target object's native deleter
					Reflect.deleteProperty(target, key);
					onChange(target, key, previousValue, newValue);
				}
				return true;
			}
		};
		return watch(source);
	}
}
// all arguments are optional
// by default this will use a file named state.json in the current directory
// if the file does not exist, it will be created with default values
class NonVolatileObject
{
	constructor(defaults, name = 'state', path = '.')
	{
		const {join} = require('path');
		const filename = join(path, name + '.json');
		const source = load(filename, defaults || {});
		// auto-save any time the object is changed
		const onChange = () => isObject(source) ? saveAsync(filename, source) : saveAsync(filename, {});
		// save initial values in case file does not exist
		onChange(filename, source);
		// return a proxy object containing the same properties as the source defaults
		return new ObjectWatcher(source, onChange);
	}
}
// multi-consumer async-iterable tee
// iterates source exactly once, pushes each chunk to every live consumer's queue
// each for-await creates an independent async iterable consumer
// end-of-source closes all consumers
const {readFileSync, writeFileSync, readFile, writeFile, readdir, stat, rename, unlink} = require('fs');
const {exec, execFile} = require('child_process');
const {inspect} = require('util');
const KEYS = 'keys';
const VALUES = 'values';
const ENTRIES = 'entries';
const encoding = 'utf8';
const nsresolution = 1000 * 1000 * 1000;
const {parse, stringify} = JSON;
const {min, max, ceil, floor} = Math;
const tryCatch = (a, b) => {
	try {return a();}
	catch (e) {return b(e);}
};
const microseconds = () => {
	const [s, ns] = process.hrtime();
	return s * nsresolution + ns;
};
const arrayDifference = (x, y) => x.slice().filter(v => !y.includes(v));
const isTrue = x => x === true;
const isFalse = x => x === false;
const isNull = x => x === null;
const isUndefined = x => x + '' === 'undefined';
const {isArray} = Array;
const {isBuffer} = Buffer;
const {isInteger} = Number;
const isSet = x => x instanceof Set;
const isMap = x => x instanceof Map;
const isPromise = x => x instanceof Promise;
const isObject = x => typeof x === 'object' && !isArray(x);
const isBoolean = x => 'boolean' === typeof x;
const isNumber = x => 'number' === typeof x;
const isFunction = x => 'function' === typeof x;
const isString = x => 'string' === typeof x;
const isNumeric = x => isNumber(x) || isString(x) && !isNaN(x) && !isNaN(parseFloat(x));
const isEmpty = x => isNull(x) || isUndefined(x) || ((isArray(x) || isString(x)) && x.length === 0) || Object.keys(x).length === 0 || (isSet(x) || isMap(x)) && x.size === 0;
const exists = x => !(isNull(x) || isUndefined(x));
const isEqual = (...args) => args.length === 1
	? b => deepEqual(args[0], b)
	: deepEqual(args[0], args[1]);
const notEqual = (...args) => args.length === 1
	? b => !deepEqual(args[0], b)
	: !deepEqual(args[0], args[1]);
const deepEqual = (x, y) => {
	// first test basic equality, including null and undefined
	if (x === y) {return true;}
	// next compare data types
	if (typeof x !== typeof y) return false;
	// null is a type of object, but it is not equal to any other type of object so must be handled before other comparisons
	if (isNull(x) || isNull(y)) return false;
	// perform deep comparison
	switch (true)
	{
		case isFunction(x): return (isFunction(y) && x.toString() === y.toString());
		case isSet(x): return (isSet(y) && deepEqual(Array.from(x).sort(), Array.from(y).sort()));
		case isMap(x): {
			if (!isMap(y) || x.size !== y.size) return false;
			for (const [k, v] of x)
				if (!y.has(k) || !deepEqual(v, y.get(k))) return false;
			return true;
		}
		case isArray(x): {
			if (!isArray(y)) return false;
			const {length} = x;
			if (!isArray(y) || length !== y.length) return false;
			for (let i = 0; i < length; i++)
				if (!deepEqual(x[i], y[i])) return false;
			return true;
		}
		case isObject(x):
		{
			// handle edge cases where y is not a plain object (special types are already handled above)
			if (isSet(y) || isMap(y) || isArray(y)) return false;
			// compare all properties in x to properties in y
			for (const p in x)
			{
				if (Object.hasOwnProperty.call(x, p) !== Object.hasOwnProperty.call(y, p)) return false;
				// recursively call deepEqual until basic properties at every level have been compared
				if (!deepEqual(x[p], y[p])) return false;
			}
			// test for properties in y missing from x
			for (const p in y)
				if (!(p in x)) return false;
			return true;
		}
		// if we are here, inequality of basic comparison is already established at the top of the algorithm
		default: return false;
	}
};
// universal error normalizer: framework envelopes carry reason, intercepted
// native exceptions carry message, framework strings fall through untouched
const reason = error => error?.reason || error?.message || error;
const apply = function(fn, ...args) {return fn.apply(this, args);}
const identity = v => v;
const converse = v => !v;
const noop = () => {};
const execute = (x, fn) => fn(x);
const then = fn => (prev, next) => prev.then(next, isFunction(fn) ? fn : noop);
const resolve = x => Promise.resolve(x);
const reject = x => Promise.reject(x);
const concurrent = (arr, fn) => Promise.allSettled(map(fn, arr));
const pause = delay => new Promise(resolve => setTimeout(resolve, delay));
const populate = (properties, factory, mutator = v => v) => {
	const object = {};
	for (const property of properties) {object[mutator(property)] = factory(property);}
	return object;
};
const keys = obj => iterable(obj, KEYS);
const values = obj => iterable(obj, VALUES);
const entries = obj => iterable(obj);
const addGetters = (subject, props) => {for (const [prop, get] of iterable(props)) Object.defineProperty(subject, prop, {get});};
const chain = (request, response) => request.then(result => response({result}), error => response({error}));
const unchain = response => response.then(({result, error}) => error ? reject(error) : resolve(result));
const promisify = (fn, index = 0) => function(...args) {
	const callback = (resolve, reject) => fn.call(this, ...args, (e, ...results) => e
		? reject([e, ...results])
		: resolve(isNumber(index) ? results[index] : results));
	return new Promise(callback);
};
const fill = x => () => x;
const tap = (fna, fnb) => x => (fna(x), fnb ? fnb(x) : x);
const trace = (label, fn = console.log) => tap(x => fn({[label]:x}));
const error = (label, fn = console.error) => trace(label, fn);
const nvl = replace => x => exists(x)
	? x
	: replace;
const unary = fn => x => fn(x);
const binary = fn => (x, y) => fn(x, y);
const prop = x => z => isObject(z)
	? z[x]
	: isObject(x)
		? x[z]
		: null;
const iterable = (obj, type = ENTRIES) => (isObject(obj) && (type in Object))
	? Object[type](obj)
	: (type === ENTRIES ? [].entries() : []);
const expand = (...args) => args.length === 1
	? x => args[0]((y, x) => [y, ...expand(args[0], x)], () => [], x)
	: args[0]((y, x) => [y, ...expand(args[0], x)], () => [], args[1]);
const reduce = fn => (...args) => args.length === 1
	? args[0].reduce(fn)
	: args[0].reduce(fn, args[1]);
const fold = fn => (...args) => args.length === 1
	? args[0].reduceRight(fn)
	: args[0].reduceRight(fn, args[1]);
const compose = (...fns) => x => apply(fold(execute), fns, x || null);
const composeAsync = fn => (...fns) => x => apply(fold(then(fn)), fns, resolve(x));
const pipe = (...fns) => x => apply(reduce(execute), fns, x || null);
const pipeAsync = fn => (...fns) => x => apply(reduce(then(fn)), fns, resolve(x));
const concat = (y, x) => x + y;
const reverse = arr => arr.reverse();
const match = (...args) => args.length === 1
	? str => str.match(args[0]) || []
	: args[1].match(args[0]) || [];
const regex = (...args) => args.length === 1
	? str => str.match(args[0]) || []
	: args[1].match(args[0]) || [];
const forEach = (...args) => args.length === 1
	? arr => arr.forEach(args[0])
	: args[1].forEach(args[0]);
const map = (...args) => args.length === 1
	? arr => arr.map(args[0])
	: args[1].map(args[0]);
const filter = (...args) => args.length === 1
	? arr => arr.filter(args[0])
	: args[1].filter(args[0]);
const objectSort = (...args) => args.length === 1
	? arr => arr.map(compose(nvl({}), prop(args[0])))
	: args[1].map(compose(nvl({}), prop(args[0])));
const arrayColumn = (...args) => args.length === 1
	? str => args[0].map(prop(str))
	: args[0].map(prop(args[1]));
const sum = reduce(concat);
const join = (delimiter = '') => arr => arr.join(delimiter);
const split = delimiter => str => str.split(delimiter);
const trim = str => str.trim();
const toNumber = x => +x;
const toObject = str => tryCatch(() => parse(str), fill(str));
const toString = obj => tryCatch(() => stringify(obj), fill('{}'));
const toLowerCase = str => isString(str) ? str.toLowerCase() : '';
const toUpperCase = str => str.toUpperCase();
const UCFirst = str => {
	const word = str => toLowerCase(str[0]) + str.slice(1);
	return str.split(' ').map(word).join(' ');
};
const getTime = () => new Date().getTime();
const distinct = jumble => filter(exists, [...new Set(jumble)]);
const pad = str => str.padStart(2, '0');
const toInt = str => +str;
const toHMS = x => `${parseInt((x / (60 * 60)) % 24)}:${pad(''+parseInt((x / 60) % 60))}:${pad('' + parseInt(x % 60))}`;
const toSeconds = pipe(split(':'), reverse, map(Number), map((v, i) => v * Math.pow(60, i)), sum);
const clone = obj => parse(stringify(obj));
const assign = props => ({to:obj => Object.assign(obj, props)});
const bind = handlers => ({to:stream => events.call(stream, handlers)});
const includes = needle => {
	// reports the presence or absence of an array value or an object property
	// nested properties in objects can be searched by specifying an array as the path
	let handler;
	if (isArray(needle)) {
		needle = needle.slice();
		handler = haystack => {
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
		};
	} else {
		handler = haystack => isArray(haystack)
			? haystack.includes(needle)
			: isObject(haystack) && (needle in haystack);
	}
	return {in:handler};
};
const initKey = (subject, prop, predicate = {}) => {
	includes(prop).in(subject) || (subject[prop] = predicate);
	return subject[prop];
};
const coroutine = (generator, ...args) => {
	const iterator = generator(...args);
	iterator.next();
	return val => iterator.next(val);
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
const inject = (obj, key, x, overwrite) => {
	!overwrite && isObject(x) && includes(key).in(obj) ? assign(x).to(obj[key]) : (obj[key] = x);
	return obj;
};
const setOrGet = (obj, arr, x, overwrite) => {
	if (isUndefined(x)) {return traverse(obj, arr);}
	const key = arr.pop();
	return inject(traverse(obj, arr), key, x, overwrite);
};
const events = function(events)
{
	for (const [type, listener] of iterable(events)) {this.on(type, listener.bind(this));}
	return this;
};
// example syntax for sorting an array of objects that have shared property names (columns): arr.sort(by(column('date', 'desc')).and(column('key')).and(column('part')));
const ordinal = ascending => ascending
	? (a, b) => a - b
	: (a, b) => b - a;
const alphabetic = ascending => ascending
	? (a, b) => a > b ? 1 : a < b ? -1 : 0
	: (a, b) => a > b ? -1 : a < b ? 1 : 0;
const by = prev => {
	const and = function(next) {return by((a, b) => this(a, b) || next(a, b));}
	return assign({and}).to(prev);
};
const column = (column, direction = 'asc', caseSensistive = false, numeric = false) => {
	if (isObject(column))
	{
		if (column.direction) {direction = column.direction;}
		if (column.caseSensistive) {caseSensistive = column.caseSensistive;}
		if (column.numeric) {numeric = column.numeric;}
		column = column.name || 'name';
	}
	direction = !isEqual('desc', toLowerCase(direction));
	return numeric
		? (a, b) => apply(ordinal(direction), a[column], b[column])
		: caseSensistive
			? (a, b) => apply(alphabetic(direction), a[column], b[column])
			: (a, b) => apply(alphabetic(direction), toLowerCase(a[column]), toLowerCase(b[column]));
};
const exception = exception => {
	const error = exception.toString ? exception.toString() : exception;
	throw isEmpty(error) ? 'a general exception occurred' : error;
};
const dir = (path, onError, raw) => raw
	? apply(promisify(readdir), path, {withFileTypes:true}).then(filter(prop('isFile')), onError || fill([]))
	: apply(promisify(readdir), path, {withFileTypes:true}).then(pipe(filter(prop('isFile')), map(prop('name'))), onError || fill([]));
const run = command => apply(promisify(exec, null), command).then(([stdout, stderr]) => toObject(trim(stdout || stderr)), ([error, stdout, stderr]) => trim(stderr || stdout || '') || error?.message || error);
const ping = address => new Promise(resolve => execFile('fping', ['-c1', '-t100', address], error => resolve(error ? false : true)));
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
	const emit = method => message => apply(tap(listeners[method]), message);
	const store = action => inject(current, 'action', abortable(action), true).action;
	const abort = () => {
		current.action.abort();
		apply(emit('abort'), aborted = true);
	};
	const settle = (message, fn) => pipe(emit(message), fn);
	const sequence = new Promise((resolve, reject) => {
		const intercept = fn => x => aborted ? reject({reason:'aborted'}) : fn(x);
		const evaluate = ({done, value}) => done
			? apply(settle('success', resolve), value)
			: store(value).then(emit('message')).then(intercept(next)).catch(intercept(exception));
		const exception = error => apply(settle('error', reject), error);
		const next = response => evaluate(iterable.next(response));
		start = function(x) {next(x); return this};
	}).then(settle('ended', resolve), settle('ended', reject));
	return {stream:{on}, sequence:assign({abort, start}).to(sequence)};
};
module.exports = {
	KEYS,
	VALUES,
	ENTRIES,
	encoding,
	nsresolution,
	Timer,
	AsyncSemaphore,
	LazyObject,
	ObjectWatcher,
	NonVolatileObject,
	keys,
	values,
	entries,
	microseconds,
	promisify,
	parse,
	stringify,
	min,
	max,
	ceil,
	floor,
	isEqual,
	notEqual,
	isArray,
	isBuffer,
	isInteger,
	isObject,
	isBoolean,
	isNumber,
	isString,
	isPromise,
	isFunction,
	isUndefined,
	isNumeric,
	isTrue,
	isFalse,
	isNull,
	isEmpty,
	exists,
	populate,
	addGetters,
	pause,
	reason,
	apply,
	identity,
	converse,
	nvl,
	tap,
	error,
	trace,
	unary,
	binary,
	prop,
	concat,
	reverse,
	match,
	regex,
	map,
	forEach,
	execute,
	expand,
	reduce,
	fold,
	sum,
	join,
	split,
	noop,
	toNumber,
	toObject,
	toString,
	toLowerCase,
	toUpperCase,
	UCFirst,
	then,
	resolve,
	reject,
	compose,
	composeAsync,
	pipe,
	pipeAsync,
	concurrent,
	chain,
	unchain,
	iterable,
	getTime,
	distinct,
	objectSort,
	arrayColumn,
	parseInt:toInt,
	pad,
	toHMS,
	toSeconds,
	clone,
	assign,
	events,
	bind,
	includes,
	arrayDifference,
	initKey,
	traverse,
	coroutine,
	filter:filterAll,
	getAllMatches,
	inject,
	index,
	setOrGet,
	by,
	column,
	exception,
	df,
	stat:promisify(stat),
	mv:promisify(rename),
	unlink:promisify(unlink),
	load,
	loadAsync,
	save,
	saveAsync,
	dir,
	run,
	ping,
	chunksToLines,
	consume
};
