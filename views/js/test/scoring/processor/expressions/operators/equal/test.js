define([
    'lodash',
    'taoQtiItem/scoring/processor/expressions/operators/equal'
], function(_, equalProcessor){
    "use strict";

    module('API');

    QUnit.test('structure', function(assert){
        assert.ok(_.isPlainObject(equalProcessor), 'the processor expose an object');
        assert.ok(_.isFunction(equalProcessor.process), 'the processor has a process function');
        assert.ok(_.isArray(equalProcessor.operands), 'the processor has a process function');
    });


    module('Process');

    var dataProvider = [{
        title : 'integers exact',
        tolerance: [],
        activeToleranceEngine: equalProcessor.engines.exact,
        includeLowerBound: true,
        includeUpperBound: true,

        operands : [{
            cardinality : 'single',
            baseType : 'integer',
            value : '5'
        }, {
            cardinality : 'single',
            baseType : 'integer',
            value : '2'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : false
        }
    },{
        title : 'float absolute 2 bounds',
        tolerance: [0.2, 0.8],
        activeToleranceEngine: equalProcessor.engines.absolute,
        includeLowerBound: true,
        includeUpperBound: true,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '5.2'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '5.7'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : true
        }
    },{
        title : 'float absolute 1 bound',
        tolerance: [0.2],
        activeToleranceEngine: equalProcessor.engines.absolute,
        includeLowerBound: true,
        includeUpperBound: true,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '5.2'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '5.7'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : false
        }
    },{
        title : 'float absolute 2 bound, not include upper',
        tolerance: [0.1, 0.5],
        activeToleranceEngine: equalProcessor.engines.absolute,
        includeLowerBound: true,
        includeUpperBound: false,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '5.3'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '5.8'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : false
        }
    },{
        title : 'float absolute 2 bound, not include lower',
        tolerance: [0.1, 0.5],
        activeToleranceEngine: equalProcessor.engines.absolute,
        includeLowerBound: false,
        includeUpperBound: true,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '5.3'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '5.2'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : false
        }
    },{
        title : 'float relative 2 bound, not include lower',
        tolerance: [50, 10],
        activeToleranceEngine: equalProcessor.engines.relative,
        includeLowerBound: false,
        includeUpperBound: true,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '10'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '15'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : false
        }
    },{
        title : 'float relative 1 bound, not include both',
        tolerance: [50],
        activeToleranceEngine: equalProcessor.engines.relative,
        includeLowerBound: false,
        includeUpperBound: false,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '1'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '1.1'
        }],
        expectedResult : {
            cardinality : 'single',
            baseType : 'boolean',
            value : true
        }
    },{
        title : 'incorrect settings for relative',
        tolerance: [],
        activeToleranceEngine: equalProcessor.engines.relative,
        includeLowerBound: false,
        includeUpperBound: false,
        operands : [{
            cardinality : 'single',
            baseType : 'float',
            value : '1'
        }, {
            cardinality : 'single',
            baseType : 'float',
            value : '1.1'
        }],
        expectedResult : null
    },{
        title : 'one null',
        operands : [{
            cardinality : 'single',
            baseType : 'integer',
            value : 5
        },
        null],
        expectedResult : null
    }];

    QUnit
      .cases(dataProvider)
      .test('equal ', function(data, assert){
        equalProcessor.operands = data.operands;

            equalProcessor.expression = {
                attributes: {
                    includeLowerBound: data.includeLowerBound,
                    includeUpperBound: data.includeUpperBound,
                    activeToleranceEngine: data.activeToleranceEngine,
                    tolerance: data.tolerance
                }
            };

        assert.deepEqual(equalProcessor.process(), data.expectedResult, 'The equal is correct');
    });
});
