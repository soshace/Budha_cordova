(function () {
    var API_HOST = 'http://api.budha.topsdigital.ru/api/v2/';
    var yearServices = angular.module('yearServices', ['ngResource']);
    yearServices
        .factory('Year', ['$resource', function ($resource) {
            return $resource(API_HOST + 'years/:yearNumber',
                {get: {method: 'GET'}},
                {getDetailed: {method: 'GET'}, params: {year: 'year'}}
            );
        }])
        .factory('YearInfo', ['$resource', function ($resource) {
            return $resource(API_HOST + 'info/');
        }])
        .factory('YearDay', ['$resource', function ($resource) {
            return $resource(API_HOST + 'day',
                {get: {method: 'GET', params: {day: 'day', language: 'language'}}})
        }])
        .factory('CurrentFiveDaysLoader', ['$resource', '$q', 'YearDay', function ($resource, $q, YearDay) {
            return function () {
                var delay,
                    allPromises = [],
                    today = new Date(),
                    firstDay = new Date(),
                    lastDay = new Date(),
                    day,
                    formatDay
                    ;
                firstDay.setDate(today.getDate() - 2);
                lastDay.setDate(today.getDate() + 2);

                for (var d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
                    delay = $q.defer();
                    day = new Date(d);
                    formatDay = day.getDate() + '.' + (day.getMonth() + 1) + '.' + day.getFullYear();
                    allPromises.push(YearDay.get({day: formatDay}, function (result) {
                        delay.resolve(result.day);
                    }, function () {
                        delay.reject("Unable to fetch days");
                    }));
                }
                return $q.all(allPromises);
            };

        }])
        .factory('DaysLoader', ['CurrentFiveDaysLoader', function (CurrentFiveDaysLoader) {
            return function () {
                return CurrentFiveDaysLoader().then(function (result) {
                    var days = {};
                    days.result = 'ok';
                    days.days = [];

                    result.forEach(function (day) {
                        day.$promise.then(function (res) {
                            days.result = res.result == 'ok' ? days.result : days.result;
                            days.days.push(res.day);
                        })
                    });

                    return days;

                }, function () {
                    console.log('fail');
                });
            }
        }]);


}());