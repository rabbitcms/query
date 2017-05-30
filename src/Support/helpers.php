<?php
declare(strict_types=1);

use DKulyk\Eloquent\Query\Contracts\QueryEntity;
use DKulyk\Eloquent\Query\Manager;
use Illuminate\Support\Facades;
use RabbitCMS\Query\Entities\Query;

if (!function_exists('get_query_builder')) {
    /**
     * Get QueryBuilder HTML template
     *
     * @param string $name
     *
     * @return string
     */
    function get_query_builder(string $name): string
    {
        /* @var QueryEntity $entity */
        $entity = Facades\App::make(Manager::class)
            ->get($name);

        $queries = Query::query()
            ->where('entity', '=', $entity->getName())
            ->get();

        return Facades\View::make('query::backend.builder', compact('entity', 'queries'))->render();
    }
}
