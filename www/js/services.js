(function () {
    var API_HOST = 'http://api.budha.topsdigital.ru/api/v1/';
    var yearServices = angular.module('yearServices', ['ngResource']);
    yearServices.factory('Year', ['$resource', function ($resource) {
        return $resource(API_HOST+'/year/:year', {year: '@year'});
    }]);
    //.factory('MultyYearLoader', ['Year', '$q',
    //    function (Year, $q) {
    //        return function () {
    //            var delay = $q.defer();
    //            Year.query(
    //                function (years) {
    //                    delay.resolve(years)
    //                }, function () {
    //                    delay.reject("Unable to fetch years")
    //                });
    //            return delay.promise;
    //        }
    //    }])
    //.factory('YearLoader', ['Year', '$route', '$q',
    //    function (Year, $route, $q) {
    //        return function () {
    //            var delay = $q.defer();
    //            Year.get({year: $route.current.params.year}, function (year) {
    //                delay.resolve(year);
    //            }, function () {
    //                delay.reject("Unable to fetch year " + $route.current.params.year);
    //            });
    //            return delay.promise;
    //        }
    //    }])
}());