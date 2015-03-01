function initAd() {

    if (window.plugins && window.plugins.AdMob) {

        var ad_units = {
            ios: {
                banner: 'ca-app-pub-7129587525075833/8641100221',
                interstitial: 'ca-app-pub-7129587525075833/3103780626'
            },
            android: {
                banner: 'ca-app-pub-7129587525075833/2734167425',
                interstitial: 'ca-app-pub-7129587525075833/1627047428'
            }
        };

        var admobid = "";

        if (/(android)/i.test(navigator.userAgent)) {
            admobid = ad_units.android;
        } else if (/(iphone|ipad)/i.test(navigator.userAgent)) {
            admobid = ad_units.ios;
        } else {
            admobid = ad_units.wp8;
        }

        window.plugins.AdMob.setOptions({
            publisherId: admobid.banner,
            interstitialAdId: admobid.interstitial,
            bannerAtTop: false, // set to true, to put banner at top
            overlap: true, // set to true, to allow banner overlap webview
            offsetTopBar: true, // set to true to avoid ios7 status bar overlap
            isTesting: false, // receiving test ad
            autoShow: false // auto show interstitial ad when loaded
        });

    } else {
        //alert( 'AdMob Plugin is not ready' );
    }

}

function disallowScrollOver() {
    var selScrollable = '.scrollable';
    $(document).on('touchmove', function (e) {
        e.preventDefault();
    });
    $(document).on('touchstart', selScrollable, function (e) {
        if (e.currentTarget.scrollTop === 0) {
            e.currentTarget.scrollTop = 1;
        } else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
            e.currentTarget.scrollTop -= 1;
        }
    });

    $(document).on('touchmove', selScrollable, function (e) {
        if ($(this)[0].scrollHeight > $(this).innerHeight()) {
            e.stopPropagation();
        }
    });
}
disallowScrollOver();

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
            '$scope', '$rootScope', '$http', '$templateCache', '$filter', '$locale', 't', 'cacheAll', 'currentYear', 'selectMonth', 'Year', 'YearInfo', 'YearDay', 'DaysLoader',
            function ($scope, $rootScope, $http, $templateCache, $filter, $locale, t, cacheAll, currentYear, selectMonth, Year, YearInfo, YearDay, DaysLoader) {
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
                    surroundDay = function (day) {
                        return '<span class="number"> ' + day + ' </span>';
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
                                date: (lang == 'en-us') ? I18n.pick('month', Ymd[1] - 1).toUpperCase() + ', ' + surroundDay(Ymd[2]) : surroundDay(Ymd[2]) + I18n.pick('month_extra', Ymd[1] - 1).toUpperCase(),
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
                            app.carousel._element.prepend(html);
                        }
                        else {
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

                        if (!item) return;

                        item.popovers.forEach(function (popover) {
                            popover.destroy();
                        });
                        $('#item' + id).remove();

                        delete items[id];
                    },

                    setCurrentDay = function (index) {
                        var i = itemFirst = 0;
                        itemLast = index + 3;
                        itemCurrent = index;

                        for (i = 0; i <= itemLast; i++) {
                            if (!appendDay(i) && i == itemFirst)
                                itemFirst++;
                        }

                        app.carousel.refresh();
                        app.carousel.setActiveCarouselItemIndex(index - itemFirst, {animation: 'none'}, true);

                    },

                    setCurrentDate = function (date) {
                        var index = findIndexByDate(date);
                        if (index < 0)
                            return;

                        setCurrentDay(index);
                    },

                    setPostChange = function () {
                        app.carousel.on('postchange', function (e) {
                            var dir = e.activeIndex - e.lastActiveIndex;

                            if (!dir) return;

                            if (dir > 0) {
                                itemCurrent++;
                                appendDay(++itemLast);


                            } else {
                                itemCurrent--;

                            }

                            setImmediate(function () {
                                app.carousel.refresh();
                                if (dir > 0) {
                                    app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex(), {animation: 'none'});
                                }

                            });
                        });
                    };


                if (days) {
                    days = JSON.parse(days);
                    dates = days;
                    ons.ready(function () {
                        setCurrentDate(today);
                        setPostChange();
                        app.carousel.refresh();
                    });
                }
                else {
                    Year.getDetailed({yearNumber: currentYear()}, function (result) {
                        if (!result.code) {
                            days = result.days;
                            window.localStorage.setItem('year' + year, JSON.stringify(days));
                            setCurrentDate(today);
                            setPostChange();
                            app.carousel.refresh();
                            dates = days;
                            Year.getDetailed({yearNumber: currentYear() + 1}, function (result) {
                                if (!result.code) {
                                    days += result.days;
                                }
                            });
                        }
                    });
                }
                ons.ready(function () {
                    initAd();
                    window.plugins.AdMob.createBannerView();
                    window.plugins.AdMob.createInterstitialView();
                    window.plugins.AdMob.showInterstitialAd();
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
                    currentYear(year);

                };

                $scope.$on('lang-change', function () {
                    appScope.i18n = I18n.pick();
                    lang = I18n.getLanguage();
                    app.carousel._element.empty();
                    setCurrentDate(today);
                    app.carousel.refresh();

                });

                $scope.$on('dayclick', function (event, day) {
                    app.navi.popPage({animation: 'none'});
                    app.carousel._element.empty();
                    setCurrentDate(day.date);
                    app.carousel.refresh();
                });
                $scope.$on('todayclick', function (event) {
                    app.navi.popPage({animation: 'none'});
                    //app.carousel._element.empty();
                    //setCurrentDate(today);
                    //app.carousel.refresh();
                    var now = new Date();
                    var start = new Date(currentYear(), 0, 0);
                    var diff = now - start;
                    var oneDay = 1000 * 60 * 60 * 24;
                    var day = Math.floor(diff / oneDay) - 1;
                    app.carousel.setActiveCarouselItemIndex(day);
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
                $scope.months = I18n.pick('month');

                $scope.selectMonth = function (month, year) {
                    app.navi.popPage();
                    selectMonth(month, year);
                };

            }])

        .controller('monthController', ['$scope', '$http', '$rootScope', '$sce', 'currentYear', 'selectMonth', 'Year',
            function ($scope, $http, $rootScope, $sce, currentYear, selectMonth, Year) {
                var months,
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
                            currentWeek = 0;
                            dayCounter = 0;
                            weekCounter = (elem.length == 35) ? 5 : 6;
                            for (var week = 0; week < weekCounter; week++) {
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
                $scope.selectToday = function () {
                    $rootScope.$broadcast('todayclick');
                };

                $scope.yearsTransitionEnd = function () {
                    document.getElementsByClassName('year-item-' + currentYear())[0].scrollIntoView();
                };

                months = JSON.parse(window.localStorage.getItem('months-' + currentYear()));

                if (!months) {
                    Year.get({year: currentYear()}, function (res) {
                        months = res.days;
                        window.localStorage.setItem('months-' + currentYear(), JSON.stringify(months));
                        months = splitWeeks(fillWeeks(splitMonths(months)));
                        $scope.months = months;
                        var month = parseInt(document.getElementsByTagName('ons-carousel-item')[app.carousel.getActiveCarouselItemIndex()].id.slice(4, 6));
                        selectMonth(month - 1, currentYear());
                    })
                } else {
                    $scope.months = splitWeeks(fillWeeks(splitMonths(months)));
                }

                $scope.weekdays = I18n.pick('weekday');
                $scope.monthNames = I18n.pick('month');
                $scope.todayDate = new Date();

                $scope.$on('lang-change', function () {
                    app.navi.popPage({animation: 'none'});
                    app.navi.popPage({animation: 'none'});

                });

            }])

        .controller('infoController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            $('#info').html(I18n.pick('info'));
        }])

        .controller('settingsController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            $scope.currentLanguage = I18n.pick('language') || I18n.getLanguage();
        }])

        .controller('languageController', ['$scope', '$rootScope', '$sce', function ($scope, $rootScope, $sce) {
            var langs = ['ru-ru', 'en-us', 'mn-cyrl'];
            var languages = ['Русский', 'English', 'Монгол'];
            $scope.langs = languages;

            $scope.selectLanguage = function (index) {
                I18n.setLanguage(langs[index]);
                localStorage.setItem('lang', langs[index]);

                app.navi.popPage({animation: 'none'});
                app.navi.popPage({
                    animation: 'none', onTransitionEnd: function () {
                        app.carousel.setActiveCarouselItemIndex(app.carousel.getActiveCarouselItemIndex() + 1, {animation: 'none'});
                    }
                });

                $rootScope.$broadcast('lang-change');

            };

        }])
        .factory('selectMonth', ['$rootScope', 'currentYear', function ($rootScope, currentYear) {
            return function (month, year) {
                var elem = document.getElementsByClassName('month-item-' + year + '-' + month)[0];
                elem.scrollIntoView();
                currentYear(year);
            }
        }])
        .factory('cache', ['$rootScope', 'currentYear', 'Year', function ($rootScope, currentYear, Year) {
            return function (name) {
                var year = currentYear();
                if (!window.localStorage.getItem(name)) {
                    Year.get({year: year}, function (res) {
                        window.localStorage.setItem(name, JSON.stringify(res.days));
                    });
                }
            }
        }])
        .factory('cacheAll', ['$rootScope', 'cache', 'currentYear', function ($rootScope, cache, currentYear) {
            return function () {
                var year = currentYear();
                cache('month-' + year);
                cache('year-list');
            }
        }])
        .factory('currentYear', ['$rootScope', function ($rootScope) {
            return function (year) {
                if (year) {
                    $rootScope.currentYear = year;
                } else {
                    return $rootScope.currentYear || (new Date).getFullYear();
                }

            }

        }])
        .factory('preventDragging', function () {

        });


})();
