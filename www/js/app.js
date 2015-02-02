(function() {
    'use strict';

    var lang = 'ru-ru',

        symbols = [
            'baljinima',
            'black',
            'buddha',
            'dashinima',
            'empty',
            'fate',
            'fly',
            'great',
            'jubilee',
            'lustanaga',
            'pill',
            'scissors'
        ],

        items = {},
        itemFirst,
        itemLast
    ;

    angular.module('app', ['onsen', 'templator'])

    .controller('appController', ['$scope', function( $scope ){
        I18n.setLanguage( lang );
        $scope.i18n = I18n.pick();
        $scope.symbols = symbols;
    }])

    .controller('mainController', [
        '$scope', '$http', '$templateCache', '$filter', '$locale', 't',
        function( $scope, $http, $templateCache, $filter, $locale, t )
    {
        var todayDate = new Date(),
            year = todayDate.getFullYear(),
            month = todayDate.getMonth() + 1,
            date = todayDate.getDate(),
            today = year +'-'+ (month < 10 ? '0' : '') + month +'-'+ (date < 10 ? '0' : '') + date,

            days = window.localStorage.getItem('year' + year),

            carouselItemCache = $templateCache.get('carouselItem.html'),

            findIndexByDate = function( date ){
                for( var i = 0, l = days.length; i < l; i++ ){
                    if( days[i].date == date )
                        return i;
                }
                return -1;
            },

            maskRow = function( mask ){
                var a = [],
                    j, l = mask.length - 1;
                for( j = l; j >= 0; j-- ){
                    if( '1' === mask.substr(j, 1))
                        a.push( l - j );
                }
                return a;
            },

            appendDay = function( index, prepend ){
                var day = days[index];
                if(!day ) return false;

                var Ymd = day.date.split('-'),
                    id = Ymd.join(''),
                    idate = new Date(Ymd[0],Ymd[1],Ymd[2]),
                    mask = maskRow( day.mask.toString()),

                    $ul = $('#item'+ id +' .icons ul'),

                    html = t( carouselItemCache, {
                        id: id,
                        year: Ymd[0],
                        month: I18n.pick('month', Ymd[1] - 1),
                        date: Ymd[2],
                        weekday: I18n.pick('weekday', idate.getUTCDay() - 1),
                        moonday: day.moon_day,
                        description: day.description[lang.split('-')[0]],
                        symcount: mask.length
                    }),

                    item = {
                        day: day,
                        index: index,
                        popovers: []
                    };

                if( prepend )
                    app.carousel._element.prepend(html);
                else
                    app.carousel._element.append(html);

                mask.forEach(function(i){
                    var $li = $('<li class="'+ symbols[i] +'"></li>');
                    $ul.append( $li );
                    ons.createPopover('popover.html').then(function(popover){
                        popover._element.find('p').html( I18n.pick('symbols', i ));
                        $li.click(function(){
                            popover.show( $li[0] );
                        });
                        item.popovers.push( popover );
                    });
                });

                items[id] = item;

                return true;
            },

            removeDay = function( index ){
                var day = days[index];
                if(!day ) return;

                var id = day.date.split('-').join(''),
                    item = items[id];

                if(!item ) return;

                item.popovers.forEach(function(popover){
                    popover.destroy();
                });
                $('#item'+ id).remove();

                delete items[id];
            },

            setCurrentDay = function( index ){
                app.carousel._element.empty();

                var i = itemFirst = index - 5, itemLast = index + 5;
                for( ; i <= itemLast; i++ ){
                    if(!appendDay( i ) && i == itemFirst )
                        itemFirst++;
                }
                setImmediate(function() {
                    app.carousel.refresh();
                    console.log(index, itemFirst, itemLast);
                    app.carousel.setActiveCarouselItemIndex(index - itemFirst, {animation: 'none'});
                });
            },

            setCurrentDate = function( date ){
                var index = findIndexByDate( date );
                console.log(index);
                if( index < 0 )
                    return;

                setCurrentDay( index );
            },

            setPostChange = function(){
                app.carousel.on('postchange', function(e){
                    console.log('postchange', itemFirst, e.activeIndex );
                    setCurrentDay( itemFirst + e.activeIndex );
//                    console.log(e);
//                    var dir = e.activeIndex - e.lastActiveIndex;
//                    if(!dir ) return;
//                    if( dir > 0 ){
//                        appendDay( itemLast + 1 );
//                        removeDay( itemFirst );
//                    }
//                    else {
//                        appendDay( itemFirst - 1 );
//                        removeDay( itemLast );
//                    }
//                    setImmediate(function() {
////                            if( dir > 0 )
////                                app.carousel.setActiveCarouselItemIndex(e.activeIndex - 1, {animation: 'none'});
//                        app.carousel.refresh();
//                    });
                });
            };

        console.log(JSON.parse( days ));
//        console.log(angular.element( cache ));

        if( days ){
            days = JSON.parse( days );
            ons.ready(function() {
                setCurrentDate( today );
                app.carousel.on('postchange', function(e){
                    console.log('postchange', itemFirst, itemLast, e.activeIndex );
                    if( e.activeIndex < 2 || itemLast - itemFirst - e.activeIndex < 2 )
                        setCurrentDay( itemFirst + e.activeIndex );
                });
            });
        }
        else {
            $http.get('http://api.budha.topsdigital.ru/api/v1/year/' + year ).success( function(result){
//                window.localStorage.clear();
                days = result.info;
                window.localStorage.setItem('year' + year, JSON.stringify( days ));
                setCurrentDate( today );
            });
        }
    }])

    .controller('yearController', [ '$scope', '$http', '$rootScope', '$sce', function($scope, $rootScope, $sce){
        $scope.year = 2015;
    }])

    .controller('infoController', [ '$scope', '$rootScope', '$sce', function($scope, $rootScope, $sce){
        $('#info').html( I18n.pick('info'));
    }])

    .controller('settingsController', [ '$scope', '$rootScope', '$sce', function($scope, $rootScope, $sce){
    }])
})();
