<?php

declare(strict_types=1);

use Illuminate\Routing\Router;

/* @var Router $router */

$router->apiResource('query', 'QueryContorller', ['only' => ['store']]);

$router->group(['prefix' => 'queries'], function (Router $router) {
    $router->get('save', ['as' => 'queries.save.modal', 'uses' => 'QueriesController@getSave']);
    $router->post('save', ['as' => 'queries.save', 'uses' => 'QueriesController@postSave']);

    $router->get('filters/{entity}', ['as' => 'queries.filters', 'uses' => 'QueriesController@getFilters']);
    $router->get('values', ['as' => 'queries.values', 'uses' => 'QueriesController@getValues']);

    $router->get('rules/{id}', ['as' => 'queries.rules', 'uses' => 'QueriesController@getRules']);
});
