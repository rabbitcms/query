<?php

declare(strict_types=1);

namespace RabbitCMS\Query\View\Components;

use DKulyk\Eloquent\Query\{Contracts\QueryEntity, Manager};
use Illuminate\Database\Eloquent\{Builder, Collection};
use Illuminate\View\{Component, View};
use RabbitCMS\Modules\Concerns\BelongsToModule;
use RabbitCMS\Query\Entities\Query;

/**
 * Class QueryComponent
 */
class QueryComponent extends Component
{
    use BelongsToModule;

    /**
     * @var QueryEntity
     */
    public $entity;

    /**
     * QueryComponent constructor.
     * @param  Manager  $manager
     * @param  string  $entity
     */
    public function __construct(Manager $manager, string $entity)
    {
        $this->entity = $manager->get($entity);
    }

    /**
     * @return View|string
     */
    public function render()
    {
        return self::module()->view('backend.builder');
    }

    /**
     * @return Builder[]|Collection
     */
    public function queries()
    {
        return Query::query()
            ->where('entity', $this->entity->getName())
            ->where('hidden', false)
            ->get();
    }
}
