<?php

declare(strict_types=1);

namespace RabbitCMS\Query\View\Components;

use DKulyk\Eloquent\Query\Contracts\QueryEntity;
use DKulyk\Eloquent\Query\Manager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\View\Component;
use RabbitCMS\Modules\Concerns\BelongsToModule;
use RabbitCMS\Query\Entities\Query;

/**
 * Class QueryComponent
 */
class QueryComponent extends Component
{
    use BelongsToModule;

    /**
     * @var \DKulyk\Eloquent\Query\Contracts\QueryEntity
     */
    public $entity;

    /**
     * QueryComponent constructor.
     * @param  \DKulyk\Eloquent\Query\Manager  $manager
     * @param  string  $entity
     */
    public function __construct(Manager $manager, string $entity)
    {
        $this->entity = $manager->get($entity);
    }

    /**
     * @return \Illuminate\Contracts\View\View|\Illuminate\View\View|string
     */
    public function render()
    {
        return self::module()->view('backend.builder');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder[]|\Illuminate\Database\Eloquent\Collection
     */
    public function queries()
    {
        return Query::query()
            ->where('entity', '=', $this->entity->getName())
            ->get();
    }
}
