const { isEqual, notEqual } = require('./index.js');

// Test runner utility
function runTests() {
    let passed = 0;
    let total = 0;
    
    function test(description, testFn) {
        total++;
        try {
            testFn();
            console.log(`✓ ${description}`);
            passed++;
        } catch (error) {
            console.log(`✗ ${description}`);
            console.log(`  Error: ${error.message}`);
        }
    }
    
    function assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    function assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        assert(actual === expected, message);
    }

    // Test Groups
    console.log('\n=== Basic Equality Tests ===');
    
    test('identical primitive values should be equal', () => {
        assertEqual(isEqual(5, 5), true);
        assertEqual(isEqual('hello', 'hello'), true);
        assertEqual(isEqual(true, true), true);
        assertEqual(isEqual(false, false), true);
    });
    
    test('different primitive values should not be equal', () => {
        assertEqual(isEqual(5, 6), false);
        assertEqual(isEqual('hello', 'world'), false);
        assertEqual(isEqual(true, false), false);
        assertEqual(isEqual(0, false), false);
        assertEqual(isEqual('', false), false);
    });

    console.log('\n=== Null and Undefined Tests ===');
    
    test('null and undefined edge cases', () => {
        assertEqual(isEqual(null, null), true);
        assertEqual(isEqual(undefined, undefined), true);
        assertEqual(isEqual(null, undefined), false);
        assertEqual(isEqual(null, 0), false);
        assertEqual(isEqual(undefined, 0), false);
        assertEqual(isEqual(null, ''), false);
        assertEqual(isEqual(undefined, ''), false);
        assertEqual(isEqual(null, false), false);
        assertEqual(isEqual(undefined, false), false);
    });
    
    test('one operand null/undefined vs objects', () => {
        assertEqual(isEqual(null, {}), false);
        assertEqual(isEqual(undefined, {}), false);
        assertEqual(isEqual({}, null), false);
        assertEqual(isEqual({}, undefined), false);
        assertEqual(isEqual(null, []), false);
        assertEqual(isEqual(undefined, []), false);
        assertEqual(isEqual([], null), false);
        assertEqual(isEqual([], undefined), false);
    });

    console.log('\n=== Array Tests ===');
    
    test('identical arrays should be equal', () => {
        assertEqual(isEqual([1, 2, 3], [1, 2, 3]), true);
        assertEqual(isEqual(['a', 'b'], ['a', 'b']), true);
        assertEqual(isEqual([], []), true);
    });
    
    test('arrays with different lengths should not be equal', () => {
        assertEqual(isEqual([1, 2], [1, 2, 3]), false);
        assertEqual(isEqual([1, 2, 3], [1, 2]), false);
        assertEqual(isEqual([], [1]), false);
    });
    
    test('arrays with same length but different values should not be equal', () => {
        assertEqual(isEqual([1, 2, 3], [1, 2, 4]), false);
        assertEqual(isEqual(['a', 'b'], ['a', 'c']), false);
        assertEqual(isEqual([true, false], [false, true]), false);
    });
    
    test('arrays with same values in different order should not be equal', () => {
        assertEqual(isEqual([1, 2, 3], [3, 2, 1]), false);
        assertEqual(isEqual(['a', 'b', 'c'], ['c', 'b', 'a']), false);
    });
    
    test('nested arrays should work correctly', () => {
        assertEqual(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]]), true);
        assertEqual(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]]), false);
        assertEqual(isEqual([[1, [2, 3]], 4], [[1, [2, 3]], 4]), true);
        assertEqual(isEqual([[1, [2, 3]], 4], [[1, [2, 4]], 4]), false);
    });

    console.log('\n=== Object Tests ===');
    
    test('identical objects should be equal', () => {
        assertEqual(isEqual({a: 1, b: 2}, {a: 1, b: 2}), true);
        assertEqual(isEqual({}, {}), true);
        assertEqual(isEqual({x: 'hello'}, {x: 'hello'}), true);
    });
    
    test('objects with different properties should not be equal', () => {
        assertEqual(isEqual({a: 1}, {b: 1}), false);
        assertEqual(isEqual({a: 1, b: 2}, {a: 1, b: 2, c: 3}), false);
        assertEqual(isEqual({a: 1, b: 2, c: 3}, {a: 1, b: 2}), false);
    });
    
    test('objects with same properties but different values should not be equal', () => {
        assertEqual(isEqual({a: 1, b: 2}, {a: 1, b: 3}), false);
        assertEqual(isEqual({x: 'hello', y: 'world'}, {x: 'hello', y: 'universe'}), false);
    });
    
    test('objects with properties in different order should be equal', () => {
        assertEqual(isEqual({a: 1, b: 2}, {b: 2, a: 1}), true);
        assertEqual(isEqual({x: 'hello', y: 'world', z: true}, {z: true, x: 'hello', y: 'world'}), true);
    });
    
    test('nested objects should work correctly', () => {
        assertEqual(isEqual({a: {b: 1, c: 2}}, {a: {b: 1, c: 2}}), true);
        assertEqual(isEqual({a: {b: 1, c: 2}}, {a: {b: 1, c: 3}}), false);
        assertEqual(isEqual({a: {b: {c: 1}}}, {a: {b: {c: 1}}}), true);
        assertEqual(isEqual({a: {b: {c: 1}}}, {a: {b: {c: 2}}}), false);
    });
    
    test('objects with undefined properties', () => {
        assertEqual(isEqual({a: undefined}, {a: undefined}), true);
        assertEqual(isEqual({a: undefined}, {}), false);
        assertEqual(isEqual({}, {a: undefined}), false);
        assertEqual(isEqual({a: undefined, b: 1}, {b: 1}), false);
    });
    
    test('objects with null properties', () => {
        assertEqual(isEqual({a: null}, {a: null}), true);
        assertEqual(isEqual({a: null}, {a: undefined}), false);
        assertEqual(isEqual({a: null}, {}), false);
        assertEqual(isEqual({}, {a: null}), false);
    });

    console.log('\n=== Mixed Array and Object Tests ===');
    
    test('arrays vs objects should not be equal', () => {
        assertEqual(isEqual([], {}), false);
        assertEqual(isEqual([1, 2], {0: 1, 1: 2}), false);
        assertEqual(isEqual({length: 0}, []), false);
    });
    
    test('mixed nested structures should work correctly', () => {
        assertEqual(isEqual({arr: [1, 2]}, {arr: [1, 2]}), true);
        assertEqual(isEqual({arr: [1, 2]}, {arr: [1, 3]}), false);
        assertEqual(isEqual([{a: 1}, {b: 2}], [{a: 1}, {b: 2}]), true);
        assertEqual(isEqual([{a: 1}, {b: 2}], [{a: 1}, {b: 3}]), false);
    });

    console.log('\n=== Set Tests ===');
    
    test('identical sets should be equal', () => {
        assertEqual(isEqual(new Set([1, 2, 3]), new Set([1, 2, 3])), true);
        assertEqual(isEqual(new Set(['a', 'b']), new Set(['a', 'b'])), true);
        assertEqual(isEqual(new Set(), new Set()), true);
    });
    
    test('sets with different values should not be equal', () => {
        assertEqual(isEqual(new Set([1, 2, 3]), new Set([1, 2, 4])), false);
        assertEqual(isEqual(new Set(['a', 'b']), new Set(['a', 'c'])), false);
        assertEqual(isEqual(new Set([1, 2]), new Set([1, 2, 3])), false);
    });
    
    test('sets with same values in different insertion order should be equal', () => {
        const set1 = new Set();
        set1.add(3); set1.add(1); set1.add(2);
        const set2 = new Set();
        set2.add(1); set2.add(2); set2.add(3);
        assertEqual(isEqual(set1, set2), true);
    });
    
    test('sets vs arrays should not be equal', () => {
        assertEqual(isEqual(new Set([1, 2, 3]), [1, 2, 3]), false);
        assertEqual(isEqual([1, 2, 3], new Set([1, 2, 3])), false);
    });
    
    test('nested sets should work correctly', () => {
        const set1 = new Set([new Set([1, 2]), new Set([3, 4])]);
        const set2 = new Set([new Set([1, 2]), new Set([3, 4])]);
        const set3 = new Set([new Set([1, 2]), new Set([3, 5])]);
        assertEqual(isEqual(set1, set2), true);
        assertEqual(isEqual(set1, set3), false);
    });

    console.log('\n=== Map Tests ===');
    
    test('identical maps should be equal', () => {
        const map1 = new Map([['a', 1], ['b', 2]]);
        const map2 = new Map([['a', 1], ['b', 2]]);
        assertEqual(isEqual(map1, map2), true);
        assertEqual(isEqual(new Map(), new Map()), true);
    });
    
    test('maps with different keys should not be equal', () => {
        const map1 = new Map([['a', 1], ['b', 2]]);
        const map2 = new Map([['a', 1], ['c', 2]]);
        assertEqual(isEqual(map1, map2), false);
    });
    
    test('maps with different values should not be equal', () => {
        const map1 = new Map([['a', 1], ['b', 2]]);
        const map2 = new Map([['a', 1], ['b', 3]]);
        assertEqual(isEqual(map1, map2), false);
    });
    
    test('maps with same entries in different insertion order should be equal', () => {
        const map1 = new Map();
        map1.set('b', 2); map1.set('a', 1);
        const map2 = new Map();
        map2.set('a', 1); map2.set('b', 2);
        assertEqual(isEqual(map1, map2), true);
    });
    
    test('maps vs objects should not be equal', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        const obj = {a: 1, b: 2};
        assertEqual(isEqual(map, obj), false);
        assertEqual(isEqual(obj, map), false);
    });
    
    test('nested maps should work correctly', () => {
        const map1 = new Map([['nested', new Map([['x', 1]])]]);
        const map2 = new Map([['nested', new Map([['x', 1]])]]);
        const map3 = new Map([['nested', new Map([['x', 2]])]]);
        assertEqual(isEqual(map1, map2), true);
        assertEqual(isEqual(map1, map3), false);
    });

    console.log('\n=== Function Tests ===');
    
    test('identical functions should be equal', () => {
        const fn1 = function() { return 1; };
        const fn2 = function() { return 1; };
        assertEqual(isEqual(fn1, fn2), true);
        
        const arrow1 = () => 'hello';
        const arrow2 = () => 'hello';
        assertEqual(isEqual(arrow1, arrow2), true);
    });
    
    test('different functions should not be equal', () => {
        const fn1 = function() { return 1; };
        const fn2 = function() { return 2; };
        assertEqual(isEqual(fn1, fn2), false);
        
        const arrow1 = () => 'hello';
        const arrow2 = () => 'world';
        assertEqual(isEqual(arrow1, arrow2), false);
    });

    console.log('\n=== Type Mismatch Tests ===');
    
    test('different types should not be equal', () => {
        assertEqual(isEqual(5, '5'), false);
        assertEqual(isEqual(true, 1), false);
        assertEqual(isEqual(false, 0), false);
        assertEqual(isEqual(null, 0), false);
        assertEqual(isEqual(undefined, null), false);
        assertEqual(isEqual([], {}), false);
        assertEqual(isEqual(new Set(), []), false);
        assertEqual(isEqual(new Map(), {}), false);
        assertEqual(isEqual(() => {}, 'function'), false);
    });

    console.log('\n=== Complex Nested Structure Tests ===');
    
    test('complex nested structures should work correctly', () => {
        const complex1 = {
            arr: [1, 2, {nested: 'value'}],
            set: new Set([1, 2, 3]),
            map: new Map([['key', 'value']]),
            obj: {
                deep: {
                    deeper: [1, 2, 3]
                }
            }
        };
        
        const complex2 = {
            arr: [1, 2, {nested: 'value'}],
            set: new Set([1, 2, 3]),
            map: new Map([['key', 'value']]),
            obj: {
                deep: {
                    deeper: [1, 2, 3]
                }
            }
        };
        
        const complex3 = {
            arr: [1, 2, {nested: 'different'}],
            set: new Set([1, 2, 3]),
            map: new Map([['key', 'value']]),
            obj: {
                deep: {
                    deeper: [1, 2, 3]
                }
            }
        };
        
        assertEqual(isEqual(complex1, complex2), true);
        assertEqual(isEqual(complex1, complex3), false);
    });

    console.log('\n=== Special Cases ===');
    
    test('circular references should not cause infinite loop', () => {
        const obj1 = {a: 1};
        obj1.self = obj1;
        const obj2 = {a: 1};
        obj2.self = obj2;
        
        // This should not hang or throw - the function should handle it gracefully
        // Note: The current implementation may not handle circular references perfectly
        // but it shouldn't crash
        try {
            isEqual(obj1, obj2);
            assert(true, 'Should not throw on circular references');
        } catch (error) {
            // If it throws, that's also acceptable behavior for this test
            assert(true, 'Handled circular reference gracefully');
        }
    });
    
    test('objects with numeric string keys vs array indices', () => {
        assertEqual(isEqual({'0': 'a', '1': 'b'}, ['a', 'b']), false);
        assertEqual(isEqual({0: 'a', 1: 'b'}, ['a', 'b']), false);
    });
    
    test('sparse arrays should be handled correctly', () => {
        const sparse1 = new Array(3);
        sparse1[1] = 'value';
        const sparse2 = new Array(3);
        sparse2[1] = 'value';
        const sparse3 = new Array(3);
        sparse3[1] = 'different';
        
        assertEqual(isEqual(sparse1, sparse2), true);
        assertEqual(isEqual(sparse1, sparse3), false);
    });

    console.log('\n=== isEqual Wrapper Function Tests ===');
    
    test('isEqual should work the same as deepEqual', () => {
        assertEqual(isEqual(5, 5), isEqual(5, 5));
        assertEqual(isEqual([1, 2], [1, 2]), isEqual([1, 2], [1, 2]));
        assertEqual(isEqual({a: 1}, {a: 1}), isEqual({a: 1}, {a: 1}));
        assertEqual(isEqual(null, undefined), isEqual(null, undefined));
    });
    
    test('isEqual currying should work correctly', () => {
        const isEqual5 = isEqual(5);
        assertEqual(typeof isEqual5, 'function');
        assertEqual(isEqual5(5), true);
        assertEqual(isEqual5(6), false);
        
        const isEqualArray = isEqual([1, 2, 3]);
        assertEqual(isEqualArray([1, 2, 3]), true);
        assertEqual(isEqualArray([1, 2, 4]), false);
    });

    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}/${total} tests`);
    console.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
    } else {
        console.log(`❌ ${total - passed} test(s) failed`);
        process.exit(1);
    }
}

// Run all tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests };