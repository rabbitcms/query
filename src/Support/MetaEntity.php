<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Support;

use B2B\Enum\Enum;
use DKulyk\Eloquent\Query\Contracts\QueryManager;
use DKulyk\Eloquent\Query\Entity;
use DKulyk\Eloquent\Query\Field;
use DKulyk\Eloquent\Query\Manager;
use DKulyk\Eloquent\Query\Types;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

/**
 * Class MetaEntity
 * @package RabbitCMS\Query\Support
 */
class MetaEntity extends Entity
{
    /**
     * @var array
     */
    private $data;

    /**
     * MetaEntity constructor.
     *
     * @param array $data
     */
    public function __construct(array $data)
    {
        $class = $data['class'];
        /** @var Model $model */
        $model = new $class();
        parent::__construct($model, $data['table'] ?? $model->getTable());
        $this->data = $data;
    }

    protected function init()
    {
        /** @var Manager $manager */
        $manager = app(QueryManager::class);

        foreach ($this->data['fields'] as $data) {
            $type = null;
            switch ($data['type'] ?? '') {
                case 'relation':
                    try {
                        $type = new Types\Relation($manager->get($data['relation']));
                    } catch (\RuntimeException $e) {
                        continue 2;
                    }
                    break;
                case 'enum':
                    $enum = $data['enum'] ?? [];
                    if (is_array($enum)) {
                        $type = new Types\Enum($enum);
                        break;
                    } elseif (!is_string($data['enum'])) {
                        continue 2;
                    }
                    if (strpos($data['enum'], '@', 1) !== false) {
                        $type = new Types\AutoComplete(function (string $term) use ($data) {
                            $result = app()->call($data['enum'], ['term' => $term]);
                            if (empty($result) || !is_array($result)) {
                                return [];
                            }
                            if (is_array(reset($result))) {
                                return $result;
                            }

                            return array_map(function ($text, $id) {
                                return compact('id', 'text');
                            }, $result, array_keys($result));
                        });
                        break;
                    } elseif (is_subclass_of($data['enum'], Enum::class, true)) {
                        /** @var Enum $class */
                        $class = $data['enum'];
                        $type = new Types\Enum(array_reduce($class::values(), function (array $values, Enum $type) {
                            $values[$type->getValue()] = method_exists($type, 'getCaption')
                                ? $type->getCaption()
                                : $type->getKey();
                            return $values;
                        }, []));
                    } elseif(is_subclass_of($data['enum'], Model::class, true)) {
                        /** @var Model $class */
                        $class = $data['enum'];
                        $type = new Types\Enum($class::all()->reduce(function (array $values, Model $model) {
                            $values[$model->getKey()] = method_exists($model, 'getCaption')
                                ? $model->getCaption()
                                : $model->getKey();
                            return $values;
                        }, []));
                    }
                    break;
                case 'date':
                    $type = new Types\Date(
                        $data['format'] ?? 'd.m.Y',
                        $data['printFormat'] ?? 'dd.mm.yyyy',
                        $data['options'] ?? []
                    );
                    break;
                case 'amount':
                    $type = new Types\Amount(
                        (int)($data['precision'] ?? 2),
                        (int)($data['multiplier'] ?? 1),
                        (array)($data['options'] ?? [])
                    );
                    break;

            }
            $this->addFields(new Field($data['name'], $data['caption'] ?? $data['name'], $type,
                $data['filters'] ?? []));
        }
    }
}