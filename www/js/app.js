(function () {
    'use strict';

    var lang = window.localStorage.getItem('lang') || 'ru-ru',

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
        itemLast,
        itemCurrent,
        appScope
        ;

    angular.module('app', ['onsen', 'templator'])

        .controller('appController', ['$scope', function ($scope) {
            appScope = $scope;
            I18n.setLanguage(lang);
            $scope.i18n = I18n.pick();
            $scope.symbols = symbols;
        }])

        .controller('mainController', [
            '$scope', '$http', '$templateCache', '$filter', '$locale', 't',
            function ($scope, $http, $templateCache, $filter, $locale, t) {
                var todayDate = new Date(),
                    year = todayDate.getFullYear(),
                    month = todayDate.getMonth() + 1,
                    date = todayDate.getDate(),
                    today = year + '-' + (month < 10 ? '0' : '') + month + '-' + (date < 10 ? '0' : '') + date,

                    days = window.localStorage.getItem('year' + year),

                    carouselItemCache = $templateCache.get('carouselItem.html'),

                    findIndexByDate = function (date) {
                        for (var i = 0, l = days.length; i < l; i++) {
                            if (days[i].date == date)
                                return i;
                        }
                        return -1;
                    },

                    maskRow = function (mask) {
                        var a = [],
                            j, l = mask.length - 1;
                        for (j = l; j >= 0; j--) {
                            if ('1' === mask.substr(j, 1))
                                a.push(l - j);
                        }
                        return a;
                    },

                    appendDay = function (index, prepend) {
                        var day = days[index];
                        if (!day) return false;

                        var Ymd = day.date.split('-'),
                            id = Ymd.join(''),
                            idate = new Date(Ymd[0], Ymd[1] - 1, Ymd[2]),
                            mask = maskRow(day.mask.toString()),

                            html = t(carouselItemCache, {
                                id: id,
                                year: Ymd[0],
                                month: I18n.pick('month', Ymd[1] - 1),
                                date: Ymd[2],
                                weekday: I18n.pick('weekday', idate.getDay()),
                                moonday: day.moon_day,
                                description: day.description[lang.split('-')[0]],
                                symcount: mask.length
                            }),

                            item = {
                                day: day,
                                index: index,
                                popovers: []
                            };

                        if (prepend){
                            console.log('prepend day');
                            app.carousel._element.prepend(html);
                        }
                        else{
                            console.log('append day');
                            app.carousel._element.append(html);
                        }
                        //console.log(html);

                        mask.forEach(function (i) {
                            var $ul = $('#item' + id + ' .icons ul');
                            var $li = $('<li class="' + symbols[i] + '"></li>');
                            $ul.append($li);
                            ons.createPopover('popover.html').then(function (popover) {
                                popover._element.find('p').html(I18n.pick('symbols', i));
                                $li.click(function () {
                                    popover.show($li[0]);
                                });
                                item.popovers.push(popover);
                            });
                        });

                        items[id] = item;
                        //ons.compile(document.getElementById(''+id));
                        //var elem = document.getElementById('item'+id);
                        //elem.style.position = 'absolute';
                        //elem.style.left = parseInt(elem.previousElementSibling.style.left)+100+'%';
                        //

                        return true;
                    },

                    removeDay = function (index) {
                        var day = days[index];
                        if (!day) return;

                        var id = day.date.split('-').join(''),
                            item = items[id];

                        if (!item) return;

                        item.popovers.forEach(function (popover) {
                            popover.destroy();
                        });
                        $('#item' + id).remove();

                        delete items[id];
                    },

                    setCurrentDay = function (index) {
                        //app.carousel._element.empty();
                        console.log('setCurrentDay');
                        var i = itemFirst = index - 2;
                        itemLast = index + 2;
                        itemCurrent = index;

                        for (; i <= itemLast; i++) {
                            if (!appendDay(i) && i == itemFirst)
                                itemFirst++;
                        }

                        app.carousel.refresh();
                        app.carousel.setActiveCarouselItemIndex(index - itemFirst, {animation: 'none'});

                    },

                    setCurrentDate = function (date) {
                        var index = findIndexByDate(date);
                        if (index < 0)
                            return;

                        setCurrentDay(index);
                    },

                    setPostChange = function () {
                        app.carousel.on('postchange', function (e) {
                            console.log('setPostChange');
                            console.log('itemFirst ' + itemFirst + ' itemLast ' + itemLast);
                            console.log('currentIndex ' + itemCurrent);
                            console.log(e.lastActiveIndex);
                            console.log(e.activeIndex);


                            var dir = e.activeIndex - e.lastActiveIndex;
                            if (!dir) return;
                            if (dir > 0) {
                                itemCurrent++;
                                console.log('dir > 0');
                                //if (itemLast - itemCurrent < 3) {
                                    appendDay(++itemLast);
                                //}
                            }
                            else {
                                itemCurrent--;
                                console.log('dir < 0');
                                //if (itemCurrent - itemFirst < 3) {
                                    appendDay(--itemFirst, true);
                                //}
                            }

                            setImmediate(function () {
                                app.carousel.refresh();
                                if (dir < 0){
                                    app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex()+1, {animation: 'none'});
                                } else {
                                    app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex(), {animation: 'none'});
                                }

                            });
                        });
                        // TODO: removeDay
                        // TODO: addDay only on close currentItem

                    };

                if (days) {
                    days = JSON.parse(days);
                    ons.ready(function () {
                        setCurrentDate(today);
                        setPostChange();

                        app.carousel.refresh();

                    });
                }
                else {
                    $http.get('http://api.budha.topsdigital.ru/api/v1/year/' + year).success(function (result) {
                        days = result.info;
                        window.localStorage.setItem('year' + year, JSON.stringify(days));
                        setPostChange();
                    });
                }
                $scope.$on('lang-change', function () {
                    console.log('lang-change');

                    appScope.i18n = I18n.pick();
                    lang = I18n.getLanguage();
                    app.carousel._element.empty();
                    setCurrentDate(today);
                    app.carousel.refresh();

                });

            }])

        .controller('yearController', ['$scope', '$http', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            $scope.years = [2014, 2015, 2016];
            $scope.months = I18n.pick('month');
        }])

        .controller('infoController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            $('#info').html(I18n.pick('info'));
        }])

        .controller('settingsController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            $scope.currentLanguage = I18n.pick('language') || I18n.getLanguage();
            //    TODO: add language to the i18n
        }])

        .controller('languageController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            var langs = ['ru-ru', 'en-us', 'mn-cyrl'];
            $scope.langs = ['Русский', 'Английский', 'Монгольский'];

            $scope.selectLanguage = function (index) {
                I18n.setLanguage(langs[index]);
                localStorage.setItem('lang', langs[index]);

                app.navi.popPage();
                $rootScope.$broadcast('lang-change');

            };

        }]);


})();
