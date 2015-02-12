(function () {
    var API_HOST = 'http://api.budha.topsdigital.ru/api/v2/';
    var yearServices = angular.module('yearServices', ['ngResource']);
    yearServices
        .factory('Year', ['$resource', function ($resource) {
        return $resource(API_HOST+'years/:yearNumber',
            {get: {method: 'GET'}},
            {getDetailed: {method: 'GET'}, params:{year: 'year'}}
        );
    }])
        .factory('YearInfo', ['$resource', function ($resource) {
            return $resource(API_HOST+'info');
        }])
        .factory('YearDay', ['$resource', function($resource) {
            return $resource(API_HOST+'day',
                {get: {method: 'GET', params: {day: 'day', language: 'language'}}})
        }]);


}());