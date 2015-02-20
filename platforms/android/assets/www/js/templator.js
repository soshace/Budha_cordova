(function() {
    'use strict';

    angular.module('templator', [])

    .factory('t', function(){
        var
            parseArray = function parseArray( template, args ){
                var i, max = args.length, result = template;
                for( i = 0; i < max; i++ ){
                    result = result.replace( new RegExp('\\{\\{' + (i + 1) + '\\}\\}', 'g'), args[i]!=null ? args[i].toString() : '');
                }
                return result;
            },

            parseObject = function parseObject( template, obj ){
                var i, result = template;
                for( i in obj ){
                    if( obj.hasOwnProperty( i )){
                        result = result.replace( new RegExp('\\{\\{' + i + '\\}\\}', 'g'), obj[i]!=null ? obj[i].toString() : '');
                    }
                }
                return result;
            };

        return function(){
            if(!arguments.length )
                throw new Error( 'Template.parse have to pass at least 1st argument (template)' );

            var args = Array.prototype.slice.call( arguments ),
                template = args.shift();

            if(!args.length )
                return template;

            if( args[0] instanceof Object )
                return parseObject( template, args[0] );

            return parseArray( template, args );
        };
    });
})();