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
        appScope,
        dates
        ;

    angular.module('app', ['onsen', 'templator', 'yearServices'])
        .controller('appController', ['$scope', function ($scope) {
            appScope = $scope;
            I18n.setLanguage(lang);
            $scope.I18N = I18n;
            $scope.i18n = I18n.pick();
            $scope.symbols = symbols;
        }])

        .controller('mainController', [
            '$scope', '$rootScope', '$http', '$templateCache', '$filter', '$locale', 't', 'cacheAll', 'selectMonth', 'Year', 'YearInfo', 'YearDay', 'DaysLoader',
            function ($scope, $rootScope, $http, $templateCache, $filter, $locale, t, cacheAll, selectMonth, Year, YearInfo, YearDay, DaysLoader) {
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
                                description: day.description[lang.split('-')[0]]
                            }),

                            item = {
                                day: day,
                                index: index,
                                popovers: []
                            };

                        if (prepend) {
                            console.log('prepend day ' + id);
                            app.carousel._element.prepend(html);
                        }
                        else {
                            console.log('append day ' + id);
                            app.carousel._element.append(html);
                        }

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

                        return true;
                    },

                    removeDay = function (index) {
                        var day = days[index];
                        if (!day) return;

                        var id = day.date.split('-').join(''),
                            item = items[id];

                        console.log('removing day ' + id);

                        if (!item) return;

                        item.popovers.forEach(function (popover) {
                            popover.destroy();
                        });
                        $('#item' + id).remove();

                        delete items[id];
                    },

                    setCurrentDay = function (index) {
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
                        var allowRight = true;
                        var allowLeft = true;
                        app.carousel.on('postchange', function (e) {
                            console.log('---------------------------------');
                            console.log('postChange');
                            console.log('itemFirst ' + itemFirst + ' itemLast ' + itemLast);
                            console.log('itemCurrent ' + itemCurrent);
                            console.log(e.lastActiveIndex);
                            console.log(e.activeIndex);

                            var dir = e.activeIndex - e.lastActiveIndex;

                            if (!dir) return;

                            if (dir > 0) {
                                if (allowRight) {
                                    itemCurrent++;
                                    appendDay(++itemLast);
                                    removeDay(itemFirst++);
                                    allowLeft = false;
                                }
                                allowRight = true;
                            } else {
                                if (allowLeft) {
                                    itemCurrent--;
                                    appendDay(--itemFirst, true);
                                    removeDay(itemLast--);
                                    allowRight = false;
                                }
                                allowLeft = true;
                            }

                            setImmediate(function () {
                                console.log('action taken');
                                app.carousel.refresh();
                                if (dir < 0) {
                                    !allowRight && app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex() + 1, {animation: 'none'});
                                } else {
                                    !allowLeft && app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex() - 1, {animation: 'none'});
                                }

                            });
                        });
                    };


                if (days) {
                    //DaysLoader().then(function(result) {
                    //    days = result;
                    //    console.log(days);
                    //    dates = days;
                    //    ons.ready(function () {
                    //        setCurrentDate(today);
                    //        setPostChange();
                    //        app.carousel.refresh();
                    //        //showAd(true);
                    //    });
                    //
                    //}, function(){
                    //    console.log('fail');
                    //});
                    days = JSON.parse(days);
                    console.log(days);
                    dates = days;
                    ons.ready(function () {
                        setCurrentDate(today);
                        setPostChange();
                        app.carousel.refresh();
                        //showAd(true);
                    });
                }
                else {
                    $http.get('http://api.budha.topsdigital.ru/api/v1/year/' + year).success(function (result) {
                        console.log('http');
                        days = result.info;
                        window.localStorage.setItem('year' + year, JSON.stringify(days));
                        setCurrentDate(today);
                        setPostChange();
                        app.carousel.refresh();
                        dates = days;
                    });
                }
                ons.ready(function () {
                    console.log('ons is resdy');
                    //cacheAll();
                });
                $scope.goToMonths = function () {
                    var year,
                        month,
                        id = document.getElementsByTagName('ons-carousel-item')[app.carousel.getActiveCarouselItemIndex()].id;
                    id = id.replace('item', '');
                    year = parseInt(id.slice(0, 4));
                    month = parseInt(id.slice(4, 6));

                    app.navi.pushPage('months.html', {
                        animation: 'none', onTransitionEnd: function () {
                            selectMonth(month - 1, year);
                        }
                    });
                    $rootScope.year = year;

                };

                $scope.$on('lang-change', function () {
                    console.log('lang-change');

                    appScope.i18n = I18n.pick();
                    lang = I18n.getLanguage();
                    app.carousel._element.empty();
                    setCurrentDate(today);
                    app.carousel.refresh();

                });

                $scope.$on('dayclick', function (event, day) {
                    console.log('dayclick');
                    console.log(day.date);
                    app.navi.popPage({animation: 'none'});
                    app.carousel._element.empty();
                    setCurrentDate(day.date);
                    app.carousel.refresh();
                });

            }])

        .controller('yearController', ['$scope', '$http', '$rootScope', '$sce', '$location', 'selectMonth', 'YearInfo',
            function ($scope, $http, $rootScope, $sce, $location, selectMonth, YearInfo) {
                var years = JSON.parse(window.localStorage.getItem('year-list'));
                if (!years) {
                    YearInfo.get(function (res) {
                        years = res.years;
                        window.localStorage.setItem('year-list', JSON.stringify(res.years));
                        $scope.years = years;
                    });
                }

                $scope.years = years;
                $scope.years = [2014, 2015, 2016];
                $scope.months = I18n.pick('month');

                $scope.selectMonth = function (month, year) {
                    app.navi.popPage();
                    selectMonth(month, year);
                };

            }])

        .controller('monthController', ['$scope', '$http', '$rootScope', '$sce', 'selectMonth', 'Year',
            function ($scope, $http, $rootScope, $sce, selectMonth, Year) {
                var months,
                    currentYear,
                    maskRow = function (mask) {
                        var a = [],
                            j, l = mask.length - 1;
                        for (j = l; j >= 0; j--) {
                            if ('1' === mask.substr(j, 1))
                                a.push(l - j);
                        }
                        return a;
                    },
                    splitMonths = function (dateItems) {
                        var monthIndex = 0,
                            monthItems = [[], [], [], [], [], [], [], [], [], [], [], []],
                            currentMonth = 0,
                            lastMonth = 0,
                            mask,
                            maskElem
                            ;

                        for (var i = 0; i < dateItems.length; i++) {
                            dateItems[i]['dateParsed'] = new Date(dateItems[i]['date']);
                            mask = maskRow(dateItems[i]['mask'].toString());

                            var ul = ['<div class="icons">'], li;
                            mask.forEach(function (i) {
                                li = '<div class="' + symbols[i] + '"></div>';
                                ul.push(li);
                            });
                            ul.push('</div>');
                            dateItems[i]['maskElem'] = $sce.trustAsHtml(ul.join(''));

                            currentMonth = dateItems[i]['dateParsed'].getMonth();
                            if (lastMonth != currentMonth) {
                                monthIndex++;
                            }

                            monthItems[monthIndex].push(dateItems[i]);
                            lastMonth = currentMonth;
                        }
                        return monthItems;
                    },
                    fillWeeks = function (monthItems) {
                        var itemsToUnshift, itemsToPush;
                        monthItems.forEach(function (elem, index, arr) {
                            itemsToUnshift = elem[0].dateParsed.getDay() - 1;
                            itemsToPush = 7 - elem[elem.length - 1].dateParsed.getDay();

                            if (itemsToUnshift == -1) itemsToUnshift = 6;

                            for (var i = 0; i < itemsToUnshift; i++) {
                                elem.unshift("");
                            }
                            for (i = 0; i < itemsToPush; i++) {
                                elem.push("");
                            }

                        });
                        return monthItems;
                    },
                    splitWeeks = function (monthItems) {
                        var weeks = [],
                            months = [],
                            currentWeek,
                            dayCounter,
                            weekCounter
                            ;

                        monthItems.forEach(function (elem, index) {
                            weeks = [];
                            //months.push([]);
                            currentWeek = 0;
                            dayCounter = 0;
                            weekCounter = (elem.length == 35) ? 5 : 6;
                            for (var week = 0; week < weekCounter; week++) {
                                //months[index].push([]);
                                //months[index].push(elem.slice(dayCounter, dayCounter + 7));
                                weeks[week] = elem.slice(dayCounter, dayCounter + 7);
                                dayCounter += 7;
                            }
                            months[index] = weeks;
                        });
                        return months;
                    }
                    ;

                $scope.selectDay = function (day) {
                    if (day) {
                        $rootScope.$broadcast('dayclick', day);
                    }
                };

                $scope.yearsTransitionEnd = function () {
                    document.getElementsByClassName('year-item-'+$rootScope.year)[0].scrollIntoView();
                    console.log('year-item-'+$rootScope.year);
                };

                currentYear = $rootScope.year;
                months = JSON.parse(window.localStorage.getItem('months-' + currentYear));
                console.log('months-' + currentYear);

                if (!months) {
                    Year.get({year: currentYear}, function (res) {
                        months = res.days;
                        window.localStorage.setItem('months-' + currentYear, JSON.stringify(months));
                        months = splitWeeks(fillWeeks(splitMonths(months)));
                        $scope.months = months;
                        var month = parseInt(document.getElementsByTagName('ons-carousel-item')[app.carousel.getActiveCarouselItemIndex()].id.slice(4, 6));
                        selectMonth(month - 1, currentYear);
                    })
                } else {
                    months = splitWeeks(fillWeeks(splitMonths(months)));
                    $scope.months = months;
                }

                $scope.weekdays = I18n.pick('weekday');
                $scope.monthNames = I18n.pick('month');


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

        }])
        .factory('selectMonth', ['$rootScope', function ($rootScope) {
            return function (month, year) {
                var elem = document.getElementsByClassName('month-item-' + year + '-' + month)[0];
                elem.scrollIntoView();
                //if (elem.parentNode.previousElementSibling) {
                //    elem.parentNode.previousElementSibling.lastElementChild.scrollIntoView();
                //} else {
                //    elem.parentNode.scrollIntoView();
                //}
                $rootScope.year = year;
                console.log('month-item-' + year + '-' + month);
            }
        }])
        .factory('cache', ['$rootScope', 'Year', function ($rootScope, Year) {
            return function (name) {
                var year = $rootScope.year;
                if (!window.localStorage.getItem(name)) {
                    Year.get({year: year}, function (res) {
                        window.localStorage.setItem(name, JSON.stringify(res.days));
                    });
                }
            }
        }])
        .factory('cacheAll', ['$rootScope', 'cache', function ($rootScope, cache) {
            return function () {
                var year = $rootScope.year;
                cache('month-' + year);
                cache('year-list');
            }
        }]);

})();
